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

export const CreateTemplateToolParams = BaseToolSchema.extend({
  name: z.string().describe('The name of the template'),
  description: z.string().describe('Description of the template'),
  viewports: z
    .array(ViewportSchema)
    .describe('Viewport definitions for the template (may be empty)'),
  contentProperties: z
    .array(ContentPropertySchema)
    .describe('Content property definitions (may be empty)'),
  designProperties: z
    .array(DesignPropertySchema)
    .describe('Design property definitions (may be empty)'),
  componentTree: z
    .array(TreeNodeSchema)
    .optional()
    .describe('Optional component tree node definitions'),
  slots: z
    .array(SlotDefinitionSchema)
    .optional()
    .describe('Optional slot definitions'),
  metadata: ComponentTypeMetadataSchema.optional().describe(
    'Optional ExO metadata (tags, concepts)',
  ),
});

type Params = z.infer<typeof CreateTemplateToolParams>;

export function createTemplateTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const contentfulClient = createToolClient(config, args);

    const template = await contentfulClient.template.create(
      { spaceId: args.spaceId, environmentId: args.environmentId },
      {
        name: args.name,
        description: args.description,
        viewports: args.viewports,
        contentProperties: args.contentProperties,
        designProperties: args.designProperties,
        ...(args.componentTree && { componentTree: args.componentTree }),
        ...(args.slots && { slots: args.slots }),
        ...(args.metadata && { metadata: args.metadata }),
      } as Parameters<typeof contentfulClient.template.create>[1],
    );

    return createSuccessResponse('Template created successfully', {
      template,
    });
  }

  return withErrorHandling(tool, 'Error creating template');
}
