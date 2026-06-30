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
  ComponentTypeMetadataSchema,
} from '../../../types/componentTypeSchemas.js';
import type { ContentfulConfig } from '../../../config/types.js';

const ResourceLinkSchema = z.object({
  sys: z.object({
    type: z.literal('ResourceLink'),
    linkType: z.string().describe('Resource link type (e.g. "Contentful:Template")'),
    urn: z.string().describe('URN of the linked resource'),
  }),
});

export const CreateExperienceToolParams = BaseToolSchema.extend({
  name: z.string().describe('The name of the experience'),
  description: z.string().describe('Description of the experience'),
  template: ResourceLinkSchema.describe(
    'Resource link to the Template this experience is backed by',
  ),
  viewports: z
    .array(ViewportSchema)
    .describe('Viewport definitions for the experience (may be empty)'),
  designProperties: z
    .record(z.unknown())
    .describe(
      'Design property values keyed by property ID. Each value is a dimensioned map ' +
        '(viewport ID → design value). May be an empty object.',
    ),
  contentBindings: z
    .object({
      sys: z.object({
        type: z.literal('ResourceLink'),
        linkType: z.literal('Contentful:DataAssembly'),
        urn: z.string(),
      }),
      parameters: z
        .record(
          z.object({
            sys: z.object({
              type: z.literal('ResourceLink'),
              linkType: z.string(),
              urn: z.string(),
            }),
          }),
        )
        .describe('Parameter bindings keyed by parameter ID'),
    })
    .optional()
    .describe('Optional content bindings linking this experience to a data assembly'),
  slots: z
    .record(z.array(z.unknown()))
    .optional()
    .describe(
      'Optional slot contents keyed by slot ID. Each value is an array of FragmentNode or InlineFragmentNode.',
    ),
  metadata: ComponentTypeMetadataSchema.optional().describe(
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

    const contentfulClient = createToolClient(config, args);

    const experience = await contentfulClient.experience.create(
      { spaceId: args.spaceId, environmentId: args.environmentId },
      {
        name: args.name,
        description: args.description,
        template: args.template,
        viewports: args.viewports,
        designProperties: args.designProperties,
        ...(args.contentBindings && { contentBindings: args.contentBindings }),
        ...(args.slots && { slots: args.slots }),
        ...(args.metadata && { metadata: args.metadata }),
      } as Parameters<typeof contentfulClient.experience.create>[1],
    );

    return createSuccessResponse('Experience created successfully', {
      experience,
    });
  }

  return withErrorHandling(tool, 'Error creating experience');
}
