import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const UnpublishEntryToolParams = BaseToolSchema.extend({
  entryId: z.union([
    z.string(),
    z.array(z.string()).max(100)
  ]).describe('The ID of the entry to unpublish (string) or an array of entry IDs (up to 100 entries)'),
});

type Params = z.infer<typeof UnpublishEntryToolParams>;

async function tool(args: Params) {
  const baseParams = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  // Normalize input to always be an array (bulk operation)
  const entryIds = Array.isArray(args.entryId) ? args.entryId : [args.entryId];
  const unpublishedEntries = [];
  const errors = [];

  // Process all entries as bulk operation
  for (const entryId of entryIds) {
    try {
      const params = {
        ...baseParams,
        entryId,
      };

      // Get the entry first
      const entry = await contentfulClient.entry.get(params);
      
      // Only unpublish if the entry is currently published
      if (entry.sys.publishedVersion !== undefined) {
        // Unpublish the entry
        await contentfulClient.entry.unpublish(params, entry);
        
        unpublishedEntries.push({
          id: entry.sys.id,
          contentType: entry.sys.contentType.sys.id,
          wasPublished: true,
        });
      } else {
        // Entry was already unpublished
        unpublishedEntries.push({
          id: entry.sys.id,
          contentType: entry.sys.contentType.sys.id,
          wasPublished: false,
        });
      }
    } catch (error) {
      errors.push({
        entryId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  //return info about the entries that were unpublished, and whether any errors occurred
  return createSuccessResponse('Entry(s) unpublished successfully', {
    unpublishedEntries,
    errors,
    summary: {
      total: entryIds.length,
      successful: unpublishedEntries.length,
      failed: errors.length,
    },
  });
}

export const unpublishEntryTool = withErrorHandling(
  tool,
  'Error unpublishing entry',
); 