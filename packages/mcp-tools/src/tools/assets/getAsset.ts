import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const GetAssetToolParams = BaseToolSchema.extend({
  assetId: z.string().describe('The ID of the asset to retrieve'),
});

type Params = z.infer<typeof GetAssetToolParams>;

export function getAssetTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      assetId: args.assetId,
    };

    const contentfulClient = createToolClient(config, args);

    // Get the asset
    const asset = await contentfulClient.asset.get(params);

    return createSuccessResponse('Asset retrieved successfully', { asset });
  }

  return withErrorHandling(tool, 'Error retrieving asset');
}
