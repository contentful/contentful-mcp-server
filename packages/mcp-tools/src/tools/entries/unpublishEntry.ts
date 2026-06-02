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
  BulkOperationParams,
  createEntryUnversionedLinks,
  createEntitiesCollection,
  waitForBulkActionCompletion,
} from '../../utils/bulkOperations.js';
import type { ContentfulConfig } from '../../config/types.js';

export const UnpublishEntryToolParams = BaseToolSchema.extend({
  entryId: z
    .array(z.string())
    .min(1)
    .max(100)
    .describe(
      'Array of entry IDs to unpublish. Pass a single-element array for one entry, or up to 100 IDs for bulk operations.',
    ),
});

type Params = z.infer<typeof UnpublishEntryToolParams>;

export function unpublishEntryTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const baseParams: BulkOperationParams = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
    };

    const contentfulClient = createToolClient(config, args);

    const entryIds = args.entryId;

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

  return withErrorHandling(tool, 'Error unpublishing entry');
}
