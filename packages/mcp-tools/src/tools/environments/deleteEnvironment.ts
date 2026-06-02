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

export const DeleteEnvironmentToolParams = BaseToolSchema.extend({
  environmentId: z.string().describe('The ID of the environment to delete'),
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

type Params = z.infer<typeof DeleteEnvironmentToolParams>;

export function deleteEnvironmentTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
    };

    const contentfulClient = createToolClient(config, args);
    const environment = await contentfulClient.environment.get(params);

    const expectedToken = buildConfirmToken(
      'environment',
      args.environmentId,
      environment.sys.version,
    );
    if (args.confirm !== true || args.confirmToken !== expectedToken) {
      return createSuccessResponse(
        `${CONFIRMATION_MESSAGE_PREFIX} environment`,
        buildConfirmationPreview(
          'environment',
          args.environmentId,
          { environment },
          expectedToken,
        ),
      );
    }

    await contentfulClient.environment.delete(params);

    return createSuccessResponse('Environment deleted successfully', {
      environmentId: args.environmentId,
    });
  }

  return withErrorHandling(tool, 'Error deleting environment');
}
