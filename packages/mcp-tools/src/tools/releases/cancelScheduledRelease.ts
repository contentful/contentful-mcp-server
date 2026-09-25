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
import {
  buildConfirmToken,
  buildConfirmationPreview,
  CONFIRMATION_MESSAGE_PREFIX,
} from '../../utils/confirmation.js';
import type { ContentfulConfig } from '../../config/types.js';

export const CancelScheduledReleaseToolParams = BaseToolSchema.extend({
  releaseId: z
    .string()
    .describe('The ID of the release the scheduled action belongs to'),
  scheduledActionId: z
    .string()
    .describe('The ID of the scheduled action to cancel'),
  confirm: z
    .boolean()
    .optional()
    .describe(
      'Set to true on the second call to actually cancel the scheduled action. Required together with confirmToken.',
    ),
  confirmToken: z
    .string()
    .optional()
    .describe(
      'Token returned by the preview call; must be supplied with confirm: true.',
    ),
});

type Params = z.infer<typeof CancelScheduledReleaseToolParams>;

export function cancelScheduledReleaseTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const contentfulClient = createToolClient(config, args);
    const scheduledAction = await contentfulClient.scheduledActions.get({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      scheduledActionId: args.scheduledActionId,
    });

    if (scheduledAction.entity.sys.id !== args.releaseId) {
      throw new Error(
        `Scheduled action '${args.scheduledActionId}' targets release '${scheduledAction.entity.sys.id}', not '${args.releaseId}'.`,
      );
    }

    const expectedToken = buildConfirmToken(
      'scheduledAction',
      args.scheduledActionId,
      scheduledAction.sys.version,
    );
    if (args.confirm !== true || args.confirmToken !== expectedToken) {
      const preview = buildConfirmationPreview(
        'scheduledAction',
        args.scheduledActionId,
        { scheduledAction },
        expectedToken,
      );
      return createSuccessResponse(
        `${CONFIRMATION_MESSAGE_PREFIX} scheduled action`,
        preview,
      );
    }

    await contentfulClient.scheduledActions.delete({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      scheduledActionId: args.scheduledActionId,
    });

    return createSuccessResponse(
      'Scheduled release action canceled successfully',
      { scheduledAction },
    );
  }

  return withErrorHandling(tool, 'Error canceling scheduled release action');
}
