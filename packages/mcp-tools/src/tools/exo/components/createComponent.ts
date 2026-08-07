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
  ExoMetadataSchema,
} from '../../../types/exoSchemas.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const CreateComponentToolParams = BaseToolSchema.extend({
  name: z.string().describe('The name of the component'),
  description: z.string().describe('Description of the component'),
  viewports: z
    .array(ViewportSchema)
    .describe('Viewport definitions for the component (may be empty)'),
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
  metadata: ExoMetadataSchema.optional().describe(
    'Optional ExO metadata (tags, concepts)',
  ),
});

type Params = z.infer<typeof CreateComponentToolParams>;

export function createComponentTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const contentfulClient = createToolClient(config, args);

    const component = await contentfulClient.component.create(
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
      },
    );

    return createSuccessResponse('Component created successfully', {
      component,
    });
  }

  return withErrorHandling(tool, 'Error creating component');
}
