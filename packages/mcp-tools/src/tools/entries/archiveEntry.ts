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

export const ArchiveEntryToolParams = BaseToolSchema.extend({
  entryId: z
    .array(z.string())
    .min(1)
    .max(100)
    .describe(
      'Array of entry IDs to archive. Pass a single-element array for one entry, or up to 100 IDs for batch operations (subject to MAX_BULK_SIZE).',
    ),
  dryRun: z
    .boolean()
    .optional()
    .describe(
      'When true, returns a preview of the operation without executing it. Useful for verifying intent on bulk calls.',
    ),
});

type Params = z.infer<typeof ArchiveEntryToolParams>;

export function archiveEntryTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const entryIds = args.entryId;
    assertBulkSizeAllowed(entryIds.length, config.maxBulkSize);

    if (args.dryRun) {
      return createSuccessResponse(
        'Dry run: no changes were made',
        buildDryRunPreview({
          operation: 'archive',
          entityType: 'entry',
          ids: entryIds,
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

    for (const entryId of entryIds) {
      try {
        const params = {
          ...baseParams,
          entryId,
        };

        await contentfulClient.entry.archive(params);
        successfullyArchived.push(entryId);
      } catch (error) {
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
