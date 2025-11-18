import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import {
  BulkOperationParams,
  createEntryVersionedLinks,
  createEntitiesCollection,
  waitForBulkActionCompletion,
} from '../../utils/bulkOperations.js';

export const PublishEntryToolParams = BaseToolSchema.extend({
  entryId: z
    .union([z.string(), z.array(z.string()).max(100)])
    .describe(
      'The ID of the entry to publish (string) or an array of entry IDs (up to 100 entries)',
    ),
});

type Params = z.infer<typeof PublishEntryToolParams>;

async function tool(args: Params) {
  const baseParams: BulkOperationParams = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  // Normalize input to always be an array
  const entryIds = Array.isArray(args.entryId) ? args.entryId : [args.entryId];

  // For single entry, use individual publish for simplicity
  if (entryIds.length === 1) {
    const entryId = entryIds[0];
    const params = {
      ...baseParams,
      entryId,
    };

    // Get the entry first
    const entry = await contentfulClient.entry.get(params);

    // Publish the entry
    const publishedEntry = await contentfulClient.entry.publish(params, entry);

    return createSuccessResponse('Entry published successfully', {
      status: publishedEntry.sys.status,
      entryId,
    });
  }

  // For multiple entries, use bulk action API
  // Get the current version of each entry
  const entityVersions = await createEntryVersionedLinks(
    contentfulClient,
    baseParams,
    entryIds,
  );

  // Create the collection object
  const entitiesCollection = createEntitiesCollection(entityVersions);

  // Create the bulk action
  const bulkAction = await contentfulClient.bulkAction.publish(baseParams, {
    entities: entitiesCollection,
  });

  // Wait for the bulk action to complete
  const action = await waitForBulkActionCompletion(
    contentfulClient,
    baseParams,
    bulkAction.sys.id,
  );

  return createSuccessResponse('Entry(s) published successfully', {
    status: action.sys.status,
    entryIds,
  });
}

export const publishEntryTool = withErrorHandling(
  tool,
  'Error publishing entry',
);
