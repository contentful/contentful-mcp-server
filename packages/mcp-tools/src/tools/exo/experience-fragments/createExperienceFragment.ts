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
  ComponentResourceLinkSchema,
} from '../../../types/exoSchemas.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const CreateExperienceFragmentToolParams = BaseToolSchema.extend({
  name: z.string().describe('The name of the experience fragment'),
  description: z.string().describe('Description of the experience fragment'),
  component: ComponentResourceLinkSchema.describe(
    'Resource link to the component this experience fragment is based on',
  ),
  viewports: z
    .array(ViewportSchema)
    .describe('Viewport definitions (may be empty)'),
  designProperties: z
    .record(z.string(), DimensionedDesignPropertyValueSchema)
    .describe(
      'Design property values keyed by property ID (may be empty object)',
    ),
  contentBindings: ExperienceContentBindingsSchema.optional().describe(
    'Optional content bindings for the experience fragment',
  ),
  slots: z
    .record(z.string(), z.array(ExperienceSlotNodeSchema))
    .optional()
    .describe('Optional slot node definitions keyed by slot ID'),
  metadata: ExperienceMetadataSchema.optional().describe(
    'Optional ExO metadata (tags, concepts)',
  ),
});

type Params = z.infer<typeof CreateExperienceFragmentToolParams>;

export function createExperienceFragmentTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const contentfulClient = createToolClient(config, args);

    const experienceFragment = await contentfulClient.experienceFragment.create(
      { spaceId: args.spaceId, environmentId: args.environmentId },
      {
        name: args.name,
        description: args.description,
        component: args.component,
        viewports: args.viewports,
        designProperties: args.designProperties,
        ...(args.contentBindings && { contentBindings: args.contentBindings }),
        ...(args.slots && { slots: args.slots }),
        ...(args.metadata && { metadata: args.metadata }),
      },
    );

    return createSuccessResponse('Experience fragment created successfully', {
      experienceFragment,
    });
  }

  return withErrorHandling(tool, 'Error creating experience fragment');
}
