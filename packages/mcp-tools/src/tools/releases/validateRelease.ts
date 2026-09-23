import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const ValidateReleaseToolParams = BaseToolSchema.extend({
  releaseId: z.string().describe('The ID of the release to validate'),
  action: z
    .enum(['publish', 'unpublish'])
    .optional()
    .describe(
      'The downstream action to validate the release against. Omit to run a general validation.',
    ),
});

type Params = z.infer<typeof ValidateReleaseToolParams>;

export function validateReleaseTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      releaseId: args.releaseId,
    };

    const contentfulClient = createToolClient(config, args);

    const releaseAction = await contentfulClient.release.validate(
      params,
      args.action ? { action: args.action } : undefined,
    );

    return createSuccessResponse('Release validation queued', {
      actionId: releaseAction.sys.id,
      status: releaseAction.sys.status,
      releaseId: args.releaseId,
      note: 'Use get_release_action with this actionId to check whether validation succeeded.',
    });
  }

  return withErrorHandling(tool, 'Error validating release');
}
