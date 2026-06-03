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
  createAssetVersionedLinks,
  createEntitiesCollection,
  waitForBulkActionCompletion,
} from '../../utils/bulkOperations.js';
import {
  assertBulkSizeAllowed,
  buildDryRunPreview,
} from '../../utils/bulkLimits.js';
import type { ContentfulConfig } from '../../config/types.js';

export const PublishAssetToolParams = BaseToolSchema.extend({
  assetId: z
    .union([z.string(), z.array(z.string()).max(100)])
    .describe(
      'The ID of the asset to publish (string) or an array of asset IDs (up to 100 assets, subject to MAX_BULK_SIZE)',
    ),
  dryRun: z
    .boolean()
    .optional()
    .describe(
      'When true, returns a preview of the operation without executing it. Useful for verifying intent on bulk calls.',
    ),
});

type Params = z.infer<typeof PublishAssetToolParams>;

export function publishAssetTool(config: ContentfulConfig) {
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
          operation: 'publish',
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

    const entityVersions = await createAssetVersionedLinks(
      contentfulClient,
      baseParams,
      assetIds,
    );

    const entitiesCollection = createEntitiesCollection(entityVersions);

    const bulkAction = await contentfulClient.bulkAction.publish(baseParams, {
      entities: entitiesCollection,
    });

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

  return withErrorHandling(tool, 'Error publishing asset');
}
