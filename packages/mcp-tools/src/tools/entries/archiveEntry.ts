import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const ArchiveEntryToolParams = BaseToolSchema.extend({
  entryId: z
    .union([z.string(), z.array(z.string()).max(100)])
    .describe(
      'The ID of the entry to archive (string) or an array of entry IDs (up to 100 entries)',
    ),
});

type Params = z.infer<typeof ArchiveEntryToolParams>;

async function tool(args: Params) {
  const baseParams = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  // Normalize input to always be an array
  const entryIds = Array.isArray(args.entryId) ? args.entryId : [args.entryId];

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

export const archiveEntryTool = withErrorHandling(
  tool,
  'Error archiving entry',
);
