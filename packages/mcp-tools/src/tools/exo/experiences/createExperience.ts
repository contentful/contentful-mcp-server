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
  ExperienceMetadataSchema,
  DesignPropertyValueSchema,
  DimensionedDesignPropertyValueSchema,
  ExperienceContentBindingsSchema,
  ExperienceSlotNodeSchema,
  ExperienceTemplateResourceLinkSchema,
} from '../../../types/exoSchemas.js';
import {
  asViewportOptionalCmaPayloadWithFlattenedDesignProperties,
  type ViewportOptionalPayloadWithFlattenedDesignProperties,
} from '../../../types/cmaViewportCompatibility.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const CreateExperienceToolParams = BaseToolSchema.extend({
  name: z.string().describe('The name of the experience'),
  description: z.string().describe('Description of the experience'),
  experienceTemplate: ExperienceTemplateResourceLinkSchema.describe(
    'Resource link to the ExperienceTemplate this experience is backed by',
  ),
  designProperties: z
    .record(
      z.string(),
      z.union([
        DesignPropertyValueSchema,
        DimensionedDesignPropertyValueSchema,
      ]),
    )
    .describe(
      'Design property values keyed by property ID. Use direct design values for viewport-free writes. May be an empty object.',
    ),
  contentBindings: ExperienceContentBindingsSchema.optional().describe(
    'Optional content bindings linking this experience to a data assembly. ' +
      'Bare ResourceLinks are accepted and sent as $literal values.',
  ),
  slots: z
    .record(z.string(), z.array(ExperienceSlotNodeSchema))
    .optional()
    .describe(
      'Optional slot contents keyed by slot ID. Each value is an array of ExperienceFragmentNode or InlineExperienceFragmentNode.',
    ),
  metadata: ExperienceMetadataSchema.optional().describe(
    'Optional ExO metadata (tags, concepts)',
  ),
});

type Params = z.infer<typeof CreateExperienceToolParams>;

export function createExperienceTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const contentfulClient = createExoToolClient(config, args);

    const experienceData = {
      name: args.name,
      description: args.description,
      experienceTemplate: args.experienceTemplate,
      designProperties: args.designProperties,
      ...(args.contentBindings && { contentBindings: args.contentBindings }),
      ...(args.slots && { slots: args.slots }),
      ...(args.metadata && { metadata: args.metadata }),
    } satisfies ViewportOptionalPayloadWithFlattenedDesignProperties<
      Parameters<typeof contentfulClient.experience.create>[1]
    >;

    const experience = await contentfulClient.experience.create(
      { spaceId: args.spaceId, environmentId: args.environmentId },
      asViewportOptionalCmaPayloadWithFlattenedDesignProperties(experienceData),
    );

    return createSuccessResponse('Experience created successfully', {
      experience,
    });
  }

  return withErrorHandling(tool, 'Error creating experience');
}
