import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const UnarchiveAssetToolParams = BaseToolSchema.extend({
  assetId: z
    .union([z.string(), z.array(z.string()).max(100)])
    .describe(
      'The ID of the asset to unarchive (string) or an array of asset IDs (up to 100 assets)',
    ),
});

type Params = z.infer<typeof UnarchiveAssetToolParams>;

export function unarchiveAssetTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const baseParams = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
    };

    const contentfulClient = createToolClient(config, args);

  // Normalize input to always be an array
  const assetIds = Array.isArray(args.assetId) ? args.assetId : [args.assetId];

  // Track successfully unarchived assets
  const successfullyUnarchived: string[] = [];

  // Process each asset sequentially, stopping at first failure
  for (const assetId of assetIds) {
    try {
      const params = {
        ...baseParams,
        assetId,
      };

      // Unarchive the asset - will throw on error
      await contentfulClient.asset.unarchive(params);
      successfullyUnarchived.push(assetId);
    } catch (error) {
      // Enhance error with context about successful operations
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
