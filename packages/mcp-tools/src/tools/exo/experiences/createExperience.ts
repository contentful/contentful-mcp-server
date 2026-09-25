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
  viewports: z
    .array(ViewportSchema)
    .optional()
    .describe(
      'Optional viewport definitions for the experience. Omit for viewport-free experiences.',
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
      'Design property values keyed by property ID. When viewports are provided, each value is a dimensioned map ' +
        '(viewport ID → design value); without viewports, use a direct design value. May be an empty object.',
    ),
  contentBindings: ExperienceContentBindingsSchema.optional().describe(
    'Optional content bindings linking this experience to a data assembly',
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
      ...(args.viewports !== undefined && { viewports: args.viewports }),
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
