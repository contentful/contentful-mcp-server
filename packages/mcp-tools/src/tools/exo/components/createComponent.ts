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

export const CreateComponentToolParams = BaseToolSchema.extend({
  componentId: z
    .string()
    .optional()
    .describe(
      'Optional ID for the component. If provided, will use upsert (create via PUT) with this ID',
    ),
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

    const contentfulClient = createExoToolClient(config, args);

    const componentData = {
      name: args.name,
      description: args.description,
      viewports: args.viewports,
      contentProperties: args.contentProperties,
      designProperties: args.designProperties,
      ...(args.componentTree && { componentTree: args.componentTree }),
      ...(args.slots && { slots: args.slots }),
      ...(args.metadata && { metadata: args.metadata }),
    };

    // Create the component with or without an explicit ID. Providing an ID
    // uses upsert (PUT) with no sys.version, which the CMA treats as a create.
    const component = args.componentId
      ? await contentfulClient.component.upsert(
          {
            spaceId: args.spaceId,
            environmentId: args.environmentId,
            componentId: args.componentId,
          },
          {
            sys: { id: args.componentId, type: 'Component' },
            ...componentData,
          },
        )
      : await contentfulClient.component.create(
          { spaceId: args.spaceId, environmentId: args.environmentId },
          componentData,
        );

    return createSuccessResponse('Component created successfully', {
      component,
    });
  }

  return withErrorHandling(tool, 'Error creating component');
}
