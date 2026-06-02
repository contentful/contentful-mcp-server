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

export const DeleteAssetToolParams = BaseToolSchema.extend({
  assetId: z.string().describe('The ID of the asset to delete'),
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

type Params = z.infer<typeof DeleteAssetToolParams>;

export function deleteAssetTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      assetId: args.assetId,
    };

    const contentfulClient = createToolClient(config, args);
    const asset = await contentfulClient.asset.get(params);

    const expectedToken = buildConfirmToken(
      'asset',
      args.assetId,
      asset.sys.version,
    );
    if (args.confirm !== true || args.confirmToken !== expectedToken) {
      return createSuccessResponse(
        `${CONFIRMATION_MESSAGE_PREFIX} asset`,
        buildConfirmationPreview(
          'asset',
          args.assetId,
          { asset },
          expectedToken,
        ),
      );
    }

    await contentfulClient.asset.delete(params);

    return createSuccessResponse('Asset deleted successfully', { asset });
  }

  return withErrorHandling(tool, 'Error deleting asset');
}
