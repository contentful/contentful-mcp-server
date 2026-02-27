import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const DeleteAssetToolParams = BaseToolSchema.extend({
  assetId: z.string().describe('The ID of the asset to delete'),
});

type Params = z.infer<typeof DeleteAssetToolParams>;

export function deleteAssetTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      assetId: args.assetId,
    };

    const contentfulClient = await createToolClient(config, args);

    // First, get the asset to store info for return
    const asset = await contentfulClient.asset.get(params);

    // Delete the asset
    await contentfulClient.asset.delete(params);

    return createSuccessResponse('Asset deleted successfully', { asset });
  }

  return withErrorHandling(tool, 'Error deleting asset');
}
