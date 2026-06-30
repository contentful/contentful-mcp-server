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
import type { ContentfulConfig } from '../../../config/types.js';

export const PublishExperienceToolParams = BaseToolSchema.extend({
  experienceId: z.string().describe('The ID of the experience to publish'),
  version: z
    .number()
    .describe(
      "REQUIRED. The experience's sys.version as returned by get_experience. " +
        'You must call get_experience first to read the current state and version. ' +
        'The publish is rejected if this does not match the current version, which means ' +
        'the experience changed since you read it.',
    ),
});

type Params = z.infer<typeof PublishExperienceToolParams>;

export function publishExperienceTool(config: ContentfulConfig) {
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

    // Read before write: the publish endpoint requires the current version.
    const current = await contentfulClient.experience.get(params);

    // Enforce read-before-write: reject if the caller's version is stale.
    if (args.version !== current.sys.version) {
      throw new Error(
        `Version conflict: the experience has changed since you read it ` +
          `(your version: ${args.version}, current version: ${current.sys.version}). ` +
          `Re-fetch the experience with get_experience and retry with the latest sys.version.`,
      );
    }

    const experience = await contentfulClient.experience.publish({
      ...params,
      version: args.version,
    });

    return createSuccessResponse('Experience published successfully', {
      experience,
    });
  }

  return withErrorHandling(tool, 'Error publishing experience');
}
