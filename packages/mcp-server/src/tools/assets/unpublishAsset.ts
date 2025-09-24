import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import {
  BulkOperationParams,
  createEntitiesCollection,
  waitForBulkActionCompletion,
  createAssetUnversionedLinks,
} from '../../utils/bulkOperations.js';

export const UnpublishAssetToolParams = BaseToolSchema.extend({
  assetId: z
    .union([z.string(), z.array(z.string()).max(100)])
    .describe(
      'The ID of the asset to unpublish (string) or an array of asset IDs (up to 100 assets)',
    ),
});

type Params = z.infer<typeof UnpublishAssetToolParams>;

async function tool(args: Params) {
  const baseParams: BulkOperationParams = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  // Normalize input to always be an array
  const assetIds = Array.isArray(args.assetId) ? args.assetId : [args.assetId];

  // For single asset, use individual unpublish for simplicity
  if (assetIds.length === 1) {
    try {
      const assetId = assetIds[0];
      const params = {
        ...baseParams,
        assetId,
      };

      // Get the asset first
      const asset = await contentfulClient.asset.get(params);

      // Unpublish the asset
      const unpublishedAsset = await contentfulClient.asset.unpublish(
        params,
        asset,
      );

      return createSuccessResponse('Asset unpublished successfully', {
        status: unpublishedAsset.sys.status,
        assetId,
      });
    } catch (error) {
      return createSuccessResponse('Asset unpublish failed', {
        status: error,
        assetId: assetIds[0],
      });
    }
  }

  // For multiple assets, use bulk action API
  // Get the unversioned links for each asset (unpublish doesn't need version info)
  const assetLinks = await createAssetUnversionedLinks(
    contentfulClient,
    baseParams,
    assetIds,
  );

  // Create the collection object
  const entitiesCollection = createEntitiesCollection(assetLinks);

  // Create the bulk action
  const bulkAction = await contentfulClient.bulkAction.unpublish(baseParams, {
    entities: entitiesCollection,
  });

  // Wait for the bulk action to complete
  const action = await waitForBulkActionCompletion(
    contentfulClient,
    baseParams,
    bulkAction.sys.id,
  );

  return createSuccessResponse('Asset(s) unpublished successfully', {
    status: action.sys.status,
    assetIds,
  });
}

export const unpublishAssetTool = withErrorHandling(
  tool,
  'Error unpublishing asset',
);
