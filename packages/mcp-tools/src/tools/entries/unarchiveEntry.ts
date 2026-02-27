import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const UnarchiveEntryToolParams = BaseToolSchema.extend({
  entryId: z
    .union([z.string(), z.array(z.string()).max(100)])
    .describe(
      'The ID of the entry to unarchive (string) or an array of entry IDs (up to 100 entries)',
    ),
});

type Params = z.infer<typeof UnarchiveEntryToolParams>;

export function unarchiveEntryTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const baseParams = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
    };

    const contentfulClient = await createToolClient(config, args);

  // Normalize input to always be an array
  const entryIds = Array.isArray(args.entryId) ? args.entryId : [args.entryId];

  // Track successfully unarchived entries
  const successfullyUnarchived: string[] = [];

  // Process each entry sequentially, stopping at first failure
  for (const entryId of entryIds) {
    try {
      const params = {
        ...baseParams,
        entryId,
      };

      // Unarchive the entry - will throw on error
      await contentfulClient.entry.unarchive(params);
      successfullyUnarchived.push(entryId);
    } catch (error) {
      // Enhance error with context about successful operations
      const errorMessage =
        successfullyUnarchived.length > 0
          ? `Failed to unarchive entry '${entryId}' after successfully unarchiving ${successfullyUnarchived.length} entry(s): [${successfullyUnarchived.join(', ')}]. Original error: ${error instanceof Error ? error.message : String(error)}`
          : `Failed to unarchive entry '${entryId}': ${error instanceof Error ? error.message : String(error)}`;

      throw new Error(errorMessage);
    }
  }

  if (entryIds.length === 1) {
    return createSuccessResponse('Entry unarchived successfully', {
      entryId: entryIds[0],
    });
  } else {
    return createSuccessResponse(
      `Successfully unarchived ${entryIds.length} entries`,
      {
        unarchivedCount: entryIds.length,
        entryIds,
      },
    );
  }
  }

  return withErrorHandling(tool, 'Error unarchiving entry');
}
