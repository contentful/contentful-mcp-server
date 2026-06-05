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
import {
  assertBulkSizeAllowed,
  buildDryRunPreview,
} from '../../utils/bulkLimits.js';
import type { ContentfulConfig } from '../../config/types.js';

export const UnpublishEntryToolParams = BaseToolSchema.extend({
  entryId: z
    .array(z.string())
    .min(1)
    .max(100)
    .describe(
      'Array of entry IDs to unpublish. Single-element array for one entry, or up to MAX_BULK_SIZE per call (default 10, max 100 — configurable via MAX_BULK_SIZE env var).',
    ),
  dryRun: z
    .boolean()
    .optional()
    .describe(
      'When true, returns a preview of the operation without executing it. Still subject to MAX_BULK_SIZE — use this to confirm intent for within-limit calls.',
    ),
});

type Params = z.infer<typeof UnpublishEntryToolParams>;

export function unpublishEntryTool(config: ContentfulConfig) {
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
          operation: 'unpublish',
          entityType: 'entry',
          ids: entryIds,
          spaceId: args.spaceId,
          environmentId: args.environmentId,
        }),
      );
    }

    const baseParams: BulkOperationParams = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
    };

    const contentfulClient = createToolClient(config, args);

    if (entryIds.length === 1) {
      const entryId = entryIds[0];
      const params = {
        ...baseParams,
        entryId,
      };

      const entry = await contentfulClient.entry.get(params);
      const unpublishedEntry = await contentfulClient.entry.unpublish(
        params,
        entry,
      );

      return createSuccessResponse('Entry unpublished successfully', {
        status: unpublishedEntry.sys.status,
        entryId,
      });
    }

    const entityLinks = await createEntryUnversionedLinks(
      contentfulClient,
      baseParams,
      entryIds,
    );

    const entitiesCollection = createEntitiesCollection(entityLinks);

    const bulkAction = await contentfulClient.bulkAction.unpublish(baseParams, {
      entities: entitiesCollection,
    });

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
