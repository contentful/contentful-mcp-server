import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const GetAiActionInvocationToolParams = BaseToolSchema.extend({
  aiActionId: z.string().describe('The ID of the AI action'),
  invocationId: z.string().describe('The ID of the invocation to retrieve'),
});

type Params = z.infer<typeof GetAiActionInvocationToolParams>;

export function getAiActionInvocationTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      aiActionId: args.aiActionId,
      invocationId: args.invocationId,
    };

    const contentfulClient = createToolClient(config, args);

    const aiActionInvocation =
      await contentfulClient.aiActionInvocation.get(params);

    return createSuccessResponse('AI action invocation retrieved successfully', {
      aiActionInvocation,
    });
  }

  return withErrorHandling(tool, 'Error retrieving AI action invocation');
}
