import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import {
  BaseToolSchema,
  createToolClient,
  assertEnvironmentNotProtected,
} from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const PublishReleaseToolParams = BaseToolSchema.extend({
  releaseId: z.string().describe('The ID of the release to publish'),
});

type Params = z.infer<typeof PublishReleaseToolParams>;

export function publishReleaseTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      releaseId: args.releaseId,
    };

    const contentfulClient = createToolClient(config, args);

    const release = await contentfulClient.release.get(params);
    const releaseAction = await contentfulClient.release.publish({
      ...params,
      version: release.sys.version,
    });

    return createSuccessResponse('Release publish queued', {
      actionId: releaseAction.sys.id,
      status: releaseAction.sys.status,
      releaseId: args.releaseId,
      note: 'Use get_release_action with this actionId to check whether the publish succeeded.',
    });
  }

  return withErrorHandling(tool, 'Error publishing release');
}
