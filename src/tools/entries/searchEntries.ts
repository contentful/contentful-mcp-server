import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { summarizeData } from '../../utils/summarizer.js';

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
        .describe('Skip this many entries for pagination'),
      order: z.string().optional().describe('Order entries by this field'),

      // Full-text search (like ivo version)
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

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  const entries = await contentfulClient.entry.getMany({
    ...params,
    query: {
      ...args.query,
      limit: Math.min(args.query.limit || 10, 100), // Allow up to 100 results, default 10
      skip: args.query.skip || 0,
    },
  });

  const summarized = summarizeData(entries, {
    maxItems: Math.min(args.query.limit || 10, 100), // Match the query limit
    remainingMessage:
      'To see more entries, please ask me to retrieve the next page.',
  });

  return createSuccessResponse('Entries retrieved successfully', {
    entries: summarized,
  });
}

export const searchEntriesTool = withErrorHandling(
  tool,
  'Error searching entries',
);
