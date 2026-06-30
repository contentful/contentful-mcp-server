import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import {
  BaseToolSchema,
  createToolClient,
  assertEnvironmentNotProtected,
} from '../../../utils/tools.js';
import {
  ViewportSchema,
  ContentPropertySchema,
  DesignPropertySchema,
  SlotDefinitionSchema,
  TreeNodeSchema,
  ComponentTypeMetadataSchema,
} from '../../../types/componentTypeSchemas.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const UpsertTemplateToolParams = BaseToolSchema.extend({
  templateId: z.string().describe('The ID of the template to update'),
  version: z
    .number()
    .describe(
      "REQUIRED. The template's sys.version as returned by get_template. " +
        'You must call get_template first to read the current state and version. ' +
        'The update is rejected if this does not match the current version, which means ' +
        'the template changed since you read it.',
    ),
  name: z.string().optional().describe('The name of the template'),
  description: z.string().optional().describe('Description of the template'),
  viewports: z
    .array(ViewportSchema)
    .optional()
    .describe('Viewport definitions; replaces existing viewports if provided'),
  contentProperties: z
    .array(ContentPropertySchema)
    .optional()
    .describe('Content property definitions; replaces existing if provided'),
  designProperties: z
    .array(DesignPropertySchema)
    .optional()
    .describe('Design property definitions; replaces existing if provided'),
  componentTree: z
    .array(TreeNodeSchema)
    .optional()
    .describe('Component tree node definitions; replaces existing if provided'),
  slots: z
    .array(SlotDefinitionSchema)
    .optional()
    .describe('Slot definitions; replaces existing if provided'),
  metadata: ComponentTypeMetadataSchema.optional().describe(
    'ExO metadata (tags, concepts); replaces existing if provided',
  ),
});

type Params = z.infer<typeof UpsertTemplateToolParams>;

export function upsertTemplateTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      templateId: args.templateId,
    };

    const contentfulClient = createToolClient(config, args);

    // Read before write: fetch current state to obtain sys.version and to
    // preserve fields the caller did not supply.
    const current = await contentfulClient.template.get(params);

    // Enforce read-before-write: the caller must supply the version it read.
    // Reject stale writes so concurrent edits are not silently overwritten.
    if (args.version !== current.sys.version) {
      throw new Error(
        `Version conflict: the template has changed since you read it ` +
          `(your version: ${args.version}, current version: ${current.sys.version}). ` +
          `Re-fetch the template with get_template and retry the update with the latest sys.version.`,
      );
    }

    const template = await contentfulClient.template.upsert(params, {
      sys: {
        id: current.sys.id,
        type: 'Template',
        version: current.sys.version,
      },
      name: args.name ?? current.name,
      description: args.description ?? current.description,
      viewports: args.viewports ?? current.viewports,
      contentProperties: args.contentProperties ?? current.contentProperties,
      designProperties: args.designProperties ?? current.designProperties,
      ...((args.componentTree ?? current.componentTree)
        ? { componentTree: args.componentTree ?? current.componentTree }
        : {}),
      ...((args.slots ?? current.slots)
        ? { slots: args.slots ?? current.slots }
        : {}),
      ...((args.metadata ?? current.metadata)
        ? { metadata: args.metadata ?? current.metadata }
        : {}),
      ...(current.dataAssemblies
        ? { dataAssemblies: current.dataAssemblies }
        : {}),
    } as Parameters<typeof contentfulClient.template.upsert>[1]);

    return createSuccessResponse('Template updated successfully', {
      template,
    });
  }

  return withErrorHandling(tool, 'Error updating template');
}
