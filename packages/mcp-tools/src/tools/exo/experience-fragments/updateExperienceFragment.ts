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
  DimensionedDesignPropertyValueSchema,
  ExperienceContentBindingsSchema,
  ExperienceSlotNodeSchema,
} from '../../../types/exoSchemas.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const UpdateExperienceFragmentToolParams = BaseToolSchema.extend({
  experienceFragmentId: z
    .string()
    .describe('The ID of the experience fragment to update'),
  version: z
    .number()
    .describe(
      "REQUIRED. The experience fragment's sys.version as returned by get_experience_fragment. " +
        'You must call get_experience_fragment first to read the current state and version. ' +
        'The update is rejected if this does not match the current version, which means ' +
        'the experience fragment changed since you read it.',
    ),
  name: z.string().optional().describe('The name of the experience fragment'),
  description: z
    .string()
    .optional()
    .describe('Description of the experience fragment'),
  viewports: z
    .array(ViewportSchema)
    .optional()
    .describe('Viewport definitions; replaces existing viewports if provided'),
  designProperties: z
    .record(z.string(), DimensionedDesignPropertyValueSchema)
    .optional()
    .describe('Design property values; replaces existing if provided'),
  contentBindings: ExperienceContentBindingsSchema.optional().describe(
    'Content bindings; replaces existing if provided',
  ),
  slots: z
    .record(z.string(), z.array(ExperienceSlotNodeSchema))
    .optional()
    .describe('Slot node definitions; replaces existing if provided'),
  metadata: ExperienceMetadataSchema.optional().describe(
    'ExO metadata (tags, concepts); replaces existing if provided',
  ),
});

type Params = z.infer<typeof UpdateExperienceFragmentToolParams>;

export function updateExperienceFragmentTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      experienceFragmentId: args.experienceFragmentId,
    };

    const contentfulClient = createExoToolClient(config, args);

    // Read before write: fetch current state to preserve fields the caller did not supply.
    const current = await contentfulClient.experienceFragment.get(params);

    // Enforce read-before-write: the caller must supply the version it read.
    if (args.version !== current.sys.version) {
      throw new Error(
        `Version conflict: the experience fragment has changed since you read it ` +
          `(your version: ${args.version}, current version: ${current.sys.version}). ` +
          `Re-fetch the experience fragment with get_experience_fragment and retry the update with the latest sys.version.`,
      );
    }

    // The tool is deliberately named update_experience_fragment even though the SDK
    // call is upsert(): the read-before-write guard above means this only ever updates
    // an existing fragment, and `update` is the verb the tool surface exposes for that.
    // Do not "fix" the tool name to match the SDK method.
    const experienceFragment = await contentfulClient.experienceFragment.upsert(
      params,
      {
        sys: {
          id: current.sys.id,
          type: 'ExperienceFragment',
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
      },
    );

    return createSuccessResponse('Experience fragment updated successfully', {
      experienceFragment,
    });
  }

  return withErrorHandling(tool, 'Error updating experience fragment');
}
