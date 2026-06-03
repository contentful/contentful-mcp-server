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
  BulkOperationParams,
  createEntitiesCollection,
  waitForBulkActionCompletion,
  createAssetUnversionedLinks,
} from '../../utils/bulkOperations.js';
import {
  assertBulkSizeAllowed,
  buildDryRunPreview,
} from '../../utils/bulkLimits.js';
import type { ContentfulConfig } from '../../config/types.js';

export const UnpublishAssetToolParams = BaseToolSchema.extend({
  assetId: z
    .union([z.string(), z.array(z.string()).max(100)])
    .describe(
      'The ID of the asset to unpublish (string) or an array of asset IDs (up to 100 assets, subject to MAX_BULK_SIZE)',
    ),
  dryRun: z
    .boolean()
    .optional()
    .describe(
      'When true, returns a preview of the operation without executing it. Useful for verifying intent on bulk calls.',
    ),
});

type Params = z.infer<typeof UnpublishAssetToolParams>;

export function unpublishAssetTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const assetIds = Array.isArray(args.assetId)
      ? args.assetId
      : [args.assetId];

    assertBulkSizeAllowed(assetIds.length, config.maxBulkSize);

    if (args.dryRun) {
      return createSuccessResponse(
        'Dry run: no changes were made',
        buildDryRunPreview({
          operation: 'unpublish',
          entityType: 'asset',
          ids: assetIds,
          spaceId: args.spaceId,
          environmentId: args.environmentId,
        }),
      );
    }

    const baseParams: BulkOperationParams = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
    };

    const contentfulClient = createToolClient(config, args);

    if (assetIds.length === 1) {
      try {
        const assetId = assetIds[0];
        const params = {
          ...baseParams,
          assetId,
        };

        const asset = await contentfulClient.asset.get(params);
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

    const assetLinks = await createAssetUnversionedLinks(
      contentfulClient,
      baseParams,
      assetIds,
    );

    const entitiesCollection = createEntitiesCollection(assetLinks);

    const bulkAction = await contentfulClient.bulkAction.unpublish(baseParams, {
      entities: entitiesCollection,
    });

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

  return withErrorHandling(tool, 'Error unpublishing asset');
}
