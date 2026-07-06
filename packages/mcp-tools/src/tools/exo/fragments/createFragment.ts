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
  ExperienceMetadataSchema,
  DimensionedDesignPropertyValueSchema,
  ExperienceContentBindingsSchema,
  ExperienceSlotNodeSchema,
  ComponentTypeResourceLinkSchema,
} from '../../../types/componentTypeSchemas.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const CreateFragmentToolParams = BaseToolSchema.extend({
  name: z.string().describe('The name of the fragment'),
  description: z.string().describe('Description of the fragment'),
  componentType: ComponentTypeResourceLinkSchema.describe(
    'Resource link to the component type this fragment is based on',
  ),
  viewports: z.array(ViewportSchema).describe('Viewport definitions (may be empty)'),
  designProperties: z
    .record(z.string(), DimensionedDesignPropertyValueSchema)
    .describe('Design property values keyed by property ID (may be empty object)'),
  contentBindings: ExperienceContentBindingsSchema.optional().describe(
    'Optional content bindings for the fragment',
  ),
  slots: z
    .record(z.string(), z.array(ExperienceSlotNodeSchema))
    .optional()
    .describe('Optional slot node definitions keyed by slot ID'),
  metadata: ExperienceMetadataSchema.optional().describe(
    'Optional ExO metadata (tags, concepts)',
  ),
});

type Params = z.infer<typeof CreateFragmentToolParams>;

export function createFragmentTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const contentfulClient = createToolClient(config, args);

    const fragment = await contentfulClient.fragment.create(
      { spaceId: args.spaceId, environmentId: args.environmentId },
      {
        name: args.name,
        description: args.description,
        componentType: args.componentType,
        viewports: args.viewports,
        designProperties: args.designProperties,
        ...(args.contentBindings && { contentBindings: args.contentBindings }),
        ...(args.slots && { slots: args.slots }),
        ...(args.metadata && { metadata: args.metadata }),
      },
    );

    return createSuccessResponse('Fragment created successfully', {
      fragment,
    });
  }

  return withErrorHandling(tool, 'Error creating fragment');
}
