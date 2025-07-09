import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const UnpublishAiActionToolParams = BaseToolSchema.extend({
  aiActionId: z.string().describe('The ID of the AI action to unpublish'),
});

type Params = z.infer<typeof UnpublishAiActionToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
    aiActionId: args.aiActionId,
  };

  const contentfulClient = createToolClient(args);

  try {
    // Unpublish the AI action
    await contentfulClient.aiAction.unpublish(params);

    return createSuccessResponse('AI action unpublished successfully', {
      aiActionId: args.aiActionId,
    });
  } catch (error) {
    return createSuccessResponse('AI action unpublish failed', {
      status: error,
      aiActionId: args.aiActionId,
    });
  }
}

export const unpublishAiActionTool = withErrorHandling(
  tool,
  'Error unpublishing AI action',
);
