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
import type { ContentfulConfig } from '../../../config/types.js';

export const PublishExperienceFragmentToolParams = BaseToolSchema.extend({
  experienceFragmentId: z
    .string()
    .describe('The ID of the experience fragment to publish'),
  version: z
    .number()
    .describe(
      "REQUIRED. The experience fragment's sys.version as returned by get_experience_fragment. " +
        'You must call get_experience_fragment first to read the current state and version. ' +
        'The publish is rejected if this does not match the current version, which means ' +
        'the experience fragment changed since you read it.',
    ),
});

type Params = z.infer<typeof PublishExperienceFragmentToolParams>;

export function publishExperienceFragmentTool(config: ContentfulConfig) {
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

    // Read before write: the publish endpoint requires the current version.
    const current = await contentfulClient.experienceFragment.get(params);

    // Enforce read-before-write: reject if the caller's version is stale.
    if (args.version !== current.sys.version) {
      throw new Error(
        `Version conflict: the experience fragment has changed since you read it ` +
          `(your version: ${args.version}, current version: ${current.sys.version}). ` +
          `Re-fetch the experience fragment with get_experience_fragment and retry with the latest sys.version.`,
      );
    }

    const experienceFragment =
      await contentfulClient.experienceFragment.publish({
        ...params,
        version: args.version,
      });

    return createSuccessResponse('Experience fragment published successfully', {
      experienceFragment,
    });
  }

  return withErrorHandling(tool, 'Error publishing experience fragment');
}
