import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import {
  BulkOperationParams,
  createEntryUnversionedLinks,
  createEntitiesCollection,
  waitForBulkActionCompletion,
} from '../../utils/bulkOperations.js';

export const UnpublishEntryToolParams = BaseToolSchema.extend({
  entryId: z
    .union([z.string(), z.array(z.string()).max(100)])
    .describe(
      'The ID of the entry to unpublish (string) or an array of entry IDs (up to 100 entries)',
    ),
});

type Params = z.infer<typeof UnpublishEntryToolParams>;

async function tool(args: Params) {
  const baseParams: BulkOperationParams = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  // Normalize input to always be an array
  const entryIds = Array.isArray(args.entryId) ? args.entryId : [args.entryId];

  // For single entry, use individual unpublish for simplicity
  if (entryIds.length === 1) {
    const entryId = entryIds[0];
    const params = {
      ...baseParams,
      entryId,
    };

    // Get the entry first
    const entry = await contentfulClient.entry.get(params);

    // Unpublish the entry
    const unpublishedEntry = await contentfulClient.entry.unpublish(
      params,
      entry,
    );

    return createSuccessResponse('Entry unpublished successfully', {
      status: unpublishedEntry.sys.status,
      entryId,
    });
  }

  // For multiple entries, use bulk action API
  // Get the unversioned links for each entry (unpublish doesn't need version info)
  const entityLinks = await createEntryUnversionedLinks(
    contentfulClient,
    baseParams,
    entryIds,
  );

  // Create the collection object
  const entitiesCollection = createEntitiesCollection(entityLinks);

  // Create the bulk action
  const bulkAction = await contentfulClient.bulkAction.unpublish(baseParams, {
    entities: entitiesCollection,
  });

  // Wait for the bulk action to complete
  const action = await waitForBulkActionCompletion(
    contentfulClient,
    baseParams,
    bulkAction.sys.id,
  );

  return createSuccessResponse('Entry(s) unpublished successfully', {
    status: action.sys.status,
    entryIds,
  });
}

export const unpublishEntryTool = withErrorHandling(
  tool,
  'Error unpublishing entry',
);
