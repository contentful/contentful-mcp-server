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
  assertBulkSizeAllowed,
  buildDryRunPreview,
} from '../../utils/bulkLimits.js';
import type { ContentfulConfig } from '../../config/types.js';

export const UnarchiveAssetToolParams = BaseToolSchema.extend({
  assetId: z
    .union([z.string(), z.array(z.string()).max(100)])
    .describe(
      'The ID of the asset to unarchive (string) or an array of asset IDs (up to 100 assets, subject to MAX_BULK_SIZE)',
    ),
  dryRun: z
    .boolean()
    .optional()
    .describe(
      'When true, returns a preview of the operation without executing it. Useful for verifying intent on bulk calls.',
    ),
});

type Params = z.infer<typeof UnarchiveAssetToolParams>;

export function unarchiveAssetTool(config: ContentfulConfig) {
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
          operation: 'unarchive',
          entityType: 'asset',
          ids: assetIds,
          spaceId: args.spaceId,
          environmentId: args.environmentId,
        }),
      );
    }

    const baseParams = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
    };

    const contentfulClient = createToolClient(config, args);

    const successfullyUnarchived: string[] = [];

    for (const assetId of assetIds) {
      try {
        const params = {
          ...baseParams,
          assetId,
        };

        await contentfulClient.asset.unarchive(params);
        successfullyUnarchived.push(assetId);
      } catch (error) {
        const errorMessage =
          successfullyUnarchived.length > 0
            ? `Failed to unarchive asset '${assetId}' after successfully unarchiving ${successfullyUnarchived.length} asset(s): [${successfullyUnarchived.join(', ')}]. Original error: ${error instanceof Error ? error.message : String(error)}`
            : `Failed to unarchive asset '${assetId}': ${error instanceof Error ? error.message : String(error)}`;

        throw new Error(errorMessage);
      }
    }

    if (assetIds.length === 1) {
      return createSuccessResponse('Asset unarchived successfully', {
        assetId: assetIds[0],
      });
    } else {
      return createSuccessResponse(
        `Successfully unarchived ${assetIds.length} assets`,
        {
          unarchivedCount: assetIds.length,
          assetIds,
        },
      );
    }
  }

  return withErrorHandling(tool, 'Error unarchiving asset');
}
