import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import {
  buildConfirmToken,
  buildConfirmationPreview,
  CONFIRMATION_MESSAGE_PREFIX,
} from '../../utils/confirmation.js';
import type { ContentfulConfig } from '../../config/types.js';

export const DeleteAiActionToolParams = BaseToolSchema.extend({
  aiActionId: z.string().describe('The ID of the AI action to delete'),
  confirm: z
    .boolean()
    .optional()
    .describe(
      'Set to true on the second call to actually perform the deletion. Required together with confirmToken.',
    ),
  confirmToken: z
    .string()
    .optional()
    .describe(
      'Token returned by the preview call; must be supplied with confirm: true.',
    ),
});

type Params = z.infer<typeof DeleteAiActionToolParams>;

export function deleteAiActionTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      aiActionId: args.aiActionId,
    };

    const contentfulClient = createToolClient(config, args);
    const aiAction = await contentfulClient.aiAction.get(params);

    const expectedToken = buildConfirmToken(
      'aiAction',
      args.aiActionId,
      aiAction.sys.version,
    );
    if (args.confirm !== true || args.confirmToken !== expectedToken) {
      return createSuccessResponse(
        `${CONFIRMATION_MESSAGE_PREFIX} AI action`,
        buildConfirmationPreview('aiAction', args.aiActionId, { aiAction }, expectedToken),
      );
    }

    await contentfulClient.aiAction.delete(params);

    return createSuccessResponse('AI action deleted successfully', { aiAction });
  }

  return withErrorHandling(tool, 'Error deleting AI action');
}
