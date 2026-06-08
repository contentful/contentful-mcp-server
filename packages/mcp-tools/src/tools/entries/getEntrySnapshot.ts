import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const GetEntrySnapshotToolParams = BaseToolSchema.extend({
  entryId: z
    .string()
    .describe('The ID of the entry to retrieve snapshots for'),
  snapshotId: z
    .string()
    .optional()
    .describe(
      'Optional snapshot ID. When provided, returns the full content of that single snapshot. When omitted, lists all available snapshots for the entry.',
    ),
});

type Params = z.infer<typeof GetEntrySnapshotToolParams>;

export function getEntrySnapshotTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createToolClient(config, args);

    // When a specific snapshotId is given, return that snapshot's full
    // content. Otherwise list all snapshots available for the entry.
    if (args.snapshotId) {
      const snapshot = await contentfulClient.snapshot.getForEntry({
        spaceId: args.spaceId,
        environmentId: args.environmentId,
        entryId: args.entryId,
        snapshotId: args.snapshotId,
      });

      return createSuccessResponse('Entry snapshot retrieved successfully', {
        snapshot,
      });
    }

    const snapshots = await contentfulClient.snapshot.getManyForEntry({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      entryId: args.entryId,
    });

    return createSuccessResponse('Entry snapshots retrieved successfully', {
      snapshots,
    });
  }

  return withErrorHandling(tool, 'Error retrieving entry snapshot');
}
