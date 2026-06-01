import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const ArchiveEntryToolParams = BaseToolSchema.extend({
  entryId: z
    .array(z.string())
    .min(1)
    .max(100)
    .describe(
      'Array of entry IDs to archive. Pass a single-element array for one entry, or up to 100 IDs for batch operations.',
    ),
});

type Params = z.infer<typeof ArchiveEntryToolParams>;

export function archiveEntryTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const baseParams = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
    };

    const contentfulClient = createToolClient(config, args);

    const entryIds = args.entryId;

    // Track successfully archived entries
    const successfullyArchived: string[] = [];

    // Process each entry sequentially, stopping at first failure
    for (const entryId of entryIds) {
      try {
        const params = {
          ...baseParams,
          entryId,
        };

        // Archive the entry - will throw on error
        await contentfulClient.entry.archive(params);
        successfullyArchived.push(entryId);
      } catch (error) {
        // Enhance error with context about successful operations
        const errorMessage =
          successfullyArchived.length > 0
            ? `Failed to archive entry '${entryId}' after successfully archiving ${successfullyArchived.length} entry(s): [${successfullyArchived.join(', ')}]. Original error: ${error instanceof Error ? error.message : String(error)}`
            : `Failed to archive entry '${entryId}': ${error instanceof Error ? error.message : String(error)}`;

        throw new Error(errorMessage);
      }
    }

    if (entryIds.length === 1) {
      return createSuccessResponse('Entry archived successfully', {
        entryId: entryIds[0],
      });
    } else {
      return createSuccessResponse(
        `Successfully archived ${entryIds.length} entries`,
        {
          archivedCount: entryIds.length,
          entryIds,
        },
      );
    }
  }

  return withErrorHandling(tool, 'Error archiving entry');
}
