import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const PublishAiActionToolParams = BaseToolSchema.extend({
  aiActionId: z.string().describe('The ID of the AI action to publish'),
});

type Params = z.infer<typeof PublishAiActionToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
    aiActionId: args.aiActionId,
  };

  const contentfulClient = createToolClient(args);

  try {
    // Get the AI action first
    const aiAction = await contentfulClient.aiAction.get(params);

    // Publish the AI action with the version parameter
    const publishedAiAction = await contentfulClient.aiAction.publish(
      {
        ...params,
        version: aiAction.sys.version,
      },
      aiAction,
    );

    return createSuccessResponse('AI action published successfully', {
      version: publishedAiAction.sys.publishedVersion,
      aiActionId: args.aiActionId,
    });
  } catch (error) {
    return createSuccessResponse('AI action publish failed', {
      status: error,
      aiActionId: args.aiActionId,
    });
  }
}

export const publishAiActionTool = withErrorHandling(
  tool,
  'Error publishing AI action',
);
