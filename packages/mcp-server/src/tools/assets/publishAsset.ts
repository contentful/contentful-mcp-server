import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import {
  BulkOperationParams,
  createAssetVersionedLinks,
  createEntitiesCollection,
  waitForBulkActionCompletion,
} from '../../utils/bulkOperations.js';

export const PublishAssetToolParams = BaseToolSchema.extend({
  assetId: z
    .union([z.string(), z.array(z.string()).max(100)])
    .describe(
      'The ID of the asset to publish (string) or an array of asset IDs (up to 100 assets)',
    ),
});

type Params = z.infer<typeof PublishAssetToolParams>;

async function tool(args: Params) {
  const baseParams: BulkOperationParams = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  // Normalize input to always be an array
  const assetIds = Array.isArray(args.assetId) ? args.assetId : [args.assetId];

  // For single asset, use individual publish
  if (assetIds.length === 1) {
    try {
      const assetId = assetIds[0];
      const params = {
        ...baseParams,
        assetId,
      };

      // Get the asset first
      const asset = await contentfulClient.asset.get(params);

      // Publish the asset
      const publishedAsset = await contentfulClient.asset.publish(
        params,
        asset,
      );

      return createSuccessResponse('Asset published successfully', {
        status: publishedAsset.sys.status,
        assetId,
      });
    } catch (error) {
      return createSuccessResponse('Asset publish failed', {
        status: error,
        assetId: assetIds[0],
      });
    }
  }

  // For multiple assets, use bulk action API
  // Get the current version of each asset
  const entityVersions = await createAssetVersionedLinks(
    contentfulClient,
    baseParams,
    assetIds,
  );

  // Create the collection object
  const entitiesCollection = createEntitiesCollection(entityVersions);

  // Create the bulk action
  const bulkAction = await contentfulClient.bulkAction.publish(baseParams, {
    entities: entitiesCollection,
  });

  // Wait for the bulk action to complete
  const action = await waitForBulkActionCompletion(
    contentfulClient,
    baseParams,
    bulkAction.sys.id,
  );

  return createSuccessResponse('Asset(s) published successfully', {
    status: action.sys.status,
    assetIds,
  });
}

export const publishAssetTool = withErrorHandling(
  tool,
  'Error publishing asset',
);
