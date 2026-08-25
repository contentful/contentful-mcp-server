import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import {
  BaseToolSchema,
  createExoToolClient,
  assertEnvironmentNotProtected,
} from '../../../utils/tools.js';
import {
  ViewportSchema,
  ContentPropertySchema,
  DesignPropertySchema,
  SlotDefinitionSchema,
  TreeNodeSchema,
  ExoMetadataSchema,
} from '../../../types/exoSchemas.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const UpsertComponentToolParams = BaseToolSchema.extend({
  componentId: z.string().describe('The ID of the component to update'),
  version: z
    .number()
    .describe(
      "REQUIRED. The component's sys.version as returned by get_component. " +
        'You must call get_component first to read the current state and version. ' +
        'The update is rejected if this does not match the current version, which means ' +
        'the component changed since you read it.',
    ),
  name: z.string().optional().describe('The name of the component'),
  description: z.string().optional().describe('Description of the component'),
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
  metadata: ExoMetadataSchema.optional().describe(
    'ExO metadata (tags, concepts); replaces existing if provided',
  ),
});

type Params = z.infer<typeof UpsertComponentToolParams>;

export function upsertComponentTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      componentId: args.componentId,
    };

    const contentfulClient = createExoToolClient(config, args);

    // Read before write: fetch current state to obtain sys.version and to
    // preserve fields the caller did not supply.
    const current = await contentfulClient.component.get(params);

    // Enforce read-before-write: the caller must supply the version it read.
    // Reject stale writes so concurrent edits are not silently overwritten.
    if (args.version !== current.sys.version) {
      throw new Error(
        `Version conflict: the component has changed since you read it ` +
          `(your version: ${args.version}, current version: ${current.sys.version}). ` +
          `Re-fetch the component with get_component and retry the update with the latest sys.version.`,
      );
    }

    const component = await contentfulClient.component.upsert(params, {
      sys: {
        id: current.sys.id,
        type: 'Component',
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
    });

    return createSuccessResponse('Component updated successfully', {
      component,
    });
  }

  return withErrorHandling(tool, 'Error updating component');
}
