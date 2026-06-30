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

export const UpsertExperienceToolParams = BaseToolSchema.extend({
  experienceId: z.string().describe('The ID of the experience to update'),
  version: z
    .number()
    .describe(
      "REQUIRED. The experience's sys.version as returned by get_experience. " +
        'You must call get_experience first to read the current state and version. ' +
        'The update is rejected if this does not match the current version, which means ' +
        'the experience changed since you read it.',
    ),
  name: z.string().optional().describe('The name of the experience'),
  description: z.string().optional().describe('Description of the experience'),
  viewports: z
    .array(ViewportSchema)
    .optional()
    .describe('Viewport definitions; replaces existing viewports if provided'),
  designProperties: z
    .record(z.unknown())
    .optional()
    .describe(
      'Design property values keyed by property ID; replaces existing if provided',
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
    .describe('Content bindings linking this experience to a data assembly; replaces existing if provided'),
  slots: z
    .record(z.array(z.unknown()))
    .optional()
    .describe(
      'Slot contents keyed by slot ID; replaces existing if provided',
    ),
  metadata: ComponentTypeMetadataSchema.optional().describe(
    'ExO metadata (tags, concepts); replaces existing if provided',
  ),
});

type Params = z.infer<typeof UpsertExperienceToolParams>;

export function upsertExperienceTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      experienceId: args.experienceId,
    };

    const contentfulClient = createToolClient(config, args);

    // Read before write: fetch current state to obtain sys.version and to
    // preserve fields the caller did not supply.
    const current = await contentfulClient.experience.get(params);

    // Enforce read-before-write: the caller must supply the version it read.
    // Reject stale writes so concurrent edits are not silently overwritten.
    if (args.version !== current.sys.version) {
      throw new Error(
        `Version conflict: the experience has changed since you read it ` +
          `(your version: ${args.version}, current version: ${current.sys.version}). ` +
          `Re-fetch the experience with get_experience and retry the update with the latest sys.version.`,
      );
    }

    const experience = await contentfulClient.experience.upsert(params, {
      sys: {
        id: current.sys.id,
        type: 'Experience',
        version: current.sys.version,
      },
      name: args.name ?? current.name,
      description: args.description ?? current.description,
      viewports: args.viewports ?? current.viewports,
      designProperties: args.designProperties ?? current.designProperties,
      ...((args.contentBindings ?? current.contentBindings)
        ? { contentBindings: args.contentBindings ?? current.contentBindings }
        : {}),
      ...((args.slots ?? current.slots)
        ? { slots: args.slots ?? current.slots }
        : {}),
      ...((args.metadata ?? current.metadata)
        ? { metadata: args.metadata ?? current.metadata }
        : {}),
    } as Parameters<typeof contentfulClient.experience.upsert>[1]);

    return createSuccessResponse('Experience updated successfully', {
      experience,
    });
  }

  return withErrorHandling(tool, 'Error updating experience');
}
