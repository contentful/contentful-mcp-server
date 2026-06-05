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

export const ArchiveAssetToolParams = BaseToolSchema.extend({
  assetId: z
    .union([z.string(), z.array(z.string()).max(100)])
    .describe(
      'A single asset ID (string) or an array of asset IDs to archive (up to MAX_BULK_SIZE per call; default 10, max 100 — configurable via MAX_BULK_SIZE env var).',
    ),
  dryRun: z
    .boolean()
    .optional()
    .describe(
      'When true, returns a preview of the operation without executing it. Still subject to MAX_BULK_SIZE — use this to confirm intent for within-limit calls.',
    ),
});

type Params = z.infer<typeof ArchiveAssetToolParams>;

export function archiveAssetTool(config: ContentfulConfig) {
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
          operation: 'archive',
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

    const successfullyArchived: string[] = [];

    for (const assetId of assetIds) {
      try {
        const params = {
          ...baseParams,
          assetId,
        };

        await contentfulClient.asset.archive(params);
        successfullyArchived.push(assetId);
      } catch (error) {
        const errorMessage =
          successfullyArchived.length > 0
            ? `Failed to archive asset '${assetId}' after successfully archiving ${successfullyArchived.length} asset(s): [${successfullyArchived.join(', ')}]. Original error: ${error instanceof Error ? error.message : String(error)}`
            : `Failed to archive asset '${assetId}': ${error instanceof Error ? error.message : String(error)}`;

        throw new Error(errorMessage);
      }
    }

    if (assetIds.length === 1) {
      return createSuccessResponse('Asset archived successfully', {
        assetId: assetIds[0],
      });
    } else {
      return createSuccessResponse(
        `Successfully archived ${assetIds.length} assets`,
        {
          archivedCount: assetIds.length,
          assetIds,
        },
      );
    }
  }

  return withErrorHandling(tool, 'Error archiving asset');
}
