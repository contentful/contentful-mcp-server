import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const GetAssetToolParams = BaseToolSchema.extend({
  assetId: z.string().describe('The ID of the asset to retrieve'),
});

type Params = z.infer<typeof GetAssetToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
    assetId: args.assetId,
  };

  const contentfulClient = createToolClient(args);

  // Get the asset
  const asset = await contentfulClient.asset.get(params);

  return createSuccessResponse('Asset retrieved successfully', { asset });
}

export const getAssetTool = withErrorHandling(tool, 'Error retrieving asset');
