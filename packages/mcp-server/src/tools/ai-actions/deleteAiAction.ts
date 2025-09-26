import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const DeleteAiActionToolParams = BaseToolSchema.extend({
  aiActionId: z.string().describe('The ID of the AI action to delete'),
});

type Params = z.infer<typeof DeleteAiActionToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
    aiActionId: args.aiActionId,
  };

  const contentfulClient = createToolClient(args);

  // First, get the AI action to store info for return
  const aiAction = await contentfulClient.aiAction.get(params);

  // Delete the AI action
  await contentfulClient.aiAction.delete(params);

  return createSuccessResponse('AI action deleted successfully', { aiAction });
}

export const deleteAiActionTool = withErrorHandling(
  tool,
  'Error deleting AI action',
);
