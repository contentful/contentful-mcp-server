import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const ArchiveAssetToolParams = BaseToolSchema.extend({
  assetId: z
    .union([z.string(), z.array(z.string()).max(100)])
    .describe(
      'The ID of the asset to archive (string) or an array of asset IDs (up to 100 assets)',
    ),
});

type Params = z.infer<typeof ArchiveAssetToolParams>;

async function tool(args: Params) {
  const baseParams = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  // Normalize input to always be an array
  const assetIds = Array.isArray(args.assetId) ? args.assetId : [args.assetId];

  // Track successfully archived assets
  const successfullyArchived: string[] = [];

  // Process each asset sequentially, stopping at first failure
  for (const assetId of assetIds) {
    try {
      const params = {
        ...baseParams,
        assetId,
      };

      // Archive the asset - will throw on error
      await contentfulClient.asset.archive(params);
      successfullyArchived.push(assetId);
    } catch (error) {
      // Enhance error with context about successful operations
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

export const archiveAssetTool = withErrorHandling(
  tool,
  'Error archiving asset',
);
