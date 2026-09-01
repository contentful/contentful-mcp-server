import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import {
  BaseToolSchema,
  createExoToolClient,
  assertEnvironmentNotProtected,
} from '../../../utils/tools.js';
import {
  buildConfirmToken,
  buildConfirmationPreview,
  CONFIRMATION_MESSAGE_PREFIX,
} from '../../../utils/confirmation.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const DeleteDesignTokenToolParams = BaseToolSchema.extend({
  designTokenId: z.string().describe('The ID of the design token to delete'),
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

type Params = z.infer<typeof DeleteDesignTokenToolParams>;

export function deleteDesignTokenTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      designTokenId: args.designTokenId,
    };

    const contentfulClient = createExoToolClient(config, args);
    const designToken = await contentfulClient.designToken.get(params);

    const expectedToken = buildConfirmToken(
      'designToken',
      args.designTokenId,
      designToken.sys.version,
    );
    if (args.confirm !== true || args.confirmToken !== expectedToken) {
      return createSuccessResponse(
        `${CONFIRMATION_MESSAGE_PREFIX} design token`,
        buildConfirmationPreview(
          'designToken',
          args.designTokenId,
          { designToken },
          expectedToken,
        ),
      );
    }

    await contentfulClient.designToken.delete(params);

    return createSuccessResponse('Design token deleted successfully', {
      designTokenId: args.designTokenId,
    });
  }

  return withErrorHandling(tool, 'Error deleting design token');
}
