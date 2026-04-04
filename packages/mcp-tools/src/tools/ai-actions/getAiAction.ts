import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const GetAiActionToolParams = BaseToolSchema.extend({
  aiActionId: z.string().describe('The ID of the AI action to retrieve'),
});

type Params = z.infer<typeof GetAiActionToolParams>;

export function getAiActionTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      aiActionId: args.aiActionId,
    };

    const contentfulClient = await createToolClient(config, args);

    // Get the AI action
    const aiAction = await contentfulClient.aiAction.get(params);

    return createSuccessResponse('AI action retrieved successfully', {
      aiAction,
    });
  }

  return withErrorHandling(tool, 'Error retrieving AI action');
}
