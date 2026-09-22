import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { summarizeData } from '../../utils/summarizer.js';
import { searchLimit } from '../../utils/limits.js';
import { normalizeArrayFilters } from '../../utils/queryParams.js';
import type { ContentfulConfig } from '../../config/types.js';

export const SearchEntriesToolParams = BaseToolSchema.extend({
  query: z
    .object({
      // Core parameters (maintain backward compatibility)
      content_type: z.string().optional().describe('Filter by content type'),
      include: z
        .number()
        .optional()
        .describe('Include this many levels of linked entries'),
      select: z
        .string()
        .optional()
        .describe('Comma-separated list of fields to return'),
      links_to_entry: z
        .string()
        .optional()
        .describe('Find entries that link to the specified entry ID'),
      limit: z
        .number()
        .optional()
        .describe(
          'Maximum number of entries to return (default: 10, max: 100)',
        ),
      skip: z
        .number()
        .optional()
        .describe(
          'Skip this many entries for pagination. Use this only for random access to a bounded page (e.g. "show me page 3"). ' +
            "Don't use skip to iterate through an entire collection — performance degrades as the offset grows. " +
            'For exhaustive traversal (exports, analytics, migrations), set cursor: true and follow pageNext instead.',
        ),
      order: z.string().optional().describe('Order entries by this field'),
      cursor: z
        .boolean()
        .optional()
        .describe(
          'Set to true to use cursor-based pagination instead of skip/limit. This is the correct way to fetch or ' +
            'process an entire collection of entries (exports, analytics, migrations), since it has no performance ' +
            'degradation as you page deeper. When set, pass the pageNext token from the previous response to fetch ' +
            'the next page (skip/total are not used in this mode).',
        ),
      pageNext: z
        .string()
        .optional()
        .describe(
          'Cursor token (from a previous cursor: true response) to fetch the next page of entries. Only used when cursor: true.',
        ),
      pagePrev: z
        .string()
        .optional()
        .describe(
          'Cursor token (from a previous cursor: true response) to fetch the previous page of entries. Only used when cursor: true.',
        ),

      // Full-text search
      query: z
        .string()
        .optional()
        .describe('Full-text search across all fields'),

      // Common field-based searches (examples - any field is supported via catchall)
      'fields.title': z.string().optional().describe('Search by title field'),
      'fields.slug': z.string().optional().describe('Search by slug field'),
      'fields.internalName': z
        .string()
        .optional()
        .describe('Search by internal name field'),
      'fields.text': z
        .string()
        .optional()
        .describe('Search by text field (useful for testimonials)'),
      'fields.title[match]': z
        .string()
        .optional()
        .describe('Pattern match on title field'),
      'fields.slug[match]': z
        .string()
        .optional()
        .describe('Pattern match on slug field'),
      'fields.title[exists]': z
        .boolean()
        .optional()
        .describe('Check if title field exists'),
      'fields.slug[exists]': z
        .boolean()
        .optional()
        .describe('Check if slug field exists'),

      // System field searches
      'sys.id[in]': z
        .array(z.string())
        .optional()
        .describe('Search by multiple entry IDs'),
      'sys.contentType.sys.id': z
        .string()
        .optional()
        .describe('Filter by content type ID'),
      'sys.createdAt[gte]': z
        .string()
        .optional()
        .describe('Created after date (ISO format)'),
      'sys.createdAt[lte]': z
        .string()
        .optional()
        .describe('Created before date (ISO format)'),
      'sys.updatedAt[gte]': z
        .string()
        .optional()
        .describe('Updated after date (ISO format)'),
      'sys.updatedAt[lte]': z
        .string()
        .optional()
        .describe('Updated before date (ISO format)'),

      // Metadata searches
      'metadata.tags.sys.id[in]': z
        .array(z.string())
        .optional()
        .describe('Filter by tag IDs'),
    })
    .catchall(z.any())
    .describe(
      'Flexible search parameters supporting ANY Contentful API query parameter. Use fields.* for field searches, sys.* for system fields, and any other Contentful API parameter.',
    ),
});

type Params = z.infer<typeof SearchEntriesToolParams>;

export function searchEntriesTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
    };

    const contentfulClient = createToolClient(config, args);

    const { cursor, pageNext, pagePrev, skip, limit, ...restQuery } =
      args.query;

    if (cursor) {
      // Cursor-based traversal: exhaustive/large-collection path. skip/total
      // don't apply here — pages.next/pages.prev drive continued iteration.
      const entries = await contentfulClient.entry.getManyWithCursor({
        ...params,
        query: normalizeArrayFilters({
          ...restQuery,
          limit: searchLimit(limit),
          ...(pageNext && { pageNext }),
          ...(pagePrev && { pagePrev }),
        }) as unknown as Parameters<
          typeof contentfulClient.entry.getManyWithCursor
        >[0]['query'],
      });

      const summarized = summarizeData(entries, {
        maxItems: searchLimit(limit),
        remainingMessage:
          'To retrieve the full collection, ask me to continue with cursor pagination (cursor: true) using the pageNext token, rather than repeatedly increasing skip.',
      });

      return createSuccessResponse('Entries retrieved successfully', {
        entries: summarized,
      });
    }

    // Existing offset-based path (unchanged behavior).
    const entries = await contentfulClient.entry.getMany({
      ...params,
      query: normalizeArrayFilters({
        ...restQuery,
        limit: searchLimit(limit),
        skip: skip || 0,
      }),
    });

    const summarized = summarizeData(entries, {
      maxItems: searchLimit(limit),
      remainingMessage:
        'To see more entries, please ask me to retrieve the next page. If you need the entire collection, ask me to use cursor pagination (cursor: true) instead of repeatedly increasing skip.',
    });

    return createSuccessResponse('Entries retrieved successfully', {
      entries: summarized,
    });
  }

  return withErrorHandling(tool, 'Error searching entries');
}
