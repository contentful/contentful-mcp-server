import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const GetReleaseActionToolParams = BaseToolSchema.extend({
  releaseId: z.string().describe('The ID of the release the action belongs to'),
  actionId: z.string().describe('The ID of the release action to retrieve'),
});

type Params = z.infer<typeof GetReleaseActionToolParams>;

export function getReleaseActionTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      releaseId: args.releaseId,
      actionId: args.actionId,
    };

    const contentfulClient = createToolClient(config, args);

    const releaseAction = await contentfulClient.releaseAction.get(params);

    return createSuccessResponse('Release action retrieved successfully', {
      releaseAction,
    });
  }

  return withErrorHandling(tool, 'Error retrieving release action');
}
