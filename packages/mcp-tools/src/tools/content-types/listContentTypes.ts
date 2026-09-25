import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import {
  summarizeData,
  summarizeCursorData,
  offsetRemainingMessage,
} from '../../utils/summarizer.js';
import type { ContentfulConfig } from '../../config/types.js';

export const ListContentTypesToolParams = BaseToolSchema.extend({
  limit: z
    .number()
    .optional()
    .describe('Maximum number of content types to return (max 10)'),
  skip: z
    .number()
    .optional()
    .describe(
      'Skip this many content types for pagination. Use this only for random access to a bounded page (e.g. "show me page 3"). ' +
        "Don't use skip to iterate through an entire collection — performance degrades as the offset grows. " +
        'For exhaustive traversal (exports, analytics, migrations), set cursor: true and follow pageNext instead.',
    ),
  cursor: z
    .boolean()
    .optional()
    .describe(
      'Set to true to use cursor-based pagination instead of skip/limit. This is the correct way to fetch or ' +
        'process an entire collection of content types (exports, analytics, migrations), since it has no performance ' +
        'degradation as you page deeper. When set, pass the pageNext token from the previous response to fetch ' +
        'the next page (skip/total are not used in this mode).',
    ),
  pageNext: z
    .string()
    .optional()
    .describe(
      'Cursor token (from a previous cursor: true response) to fetch the next page of content types. Only used when cursor: true.',
    ),
  pagePrev: z
    .string()
    .optional()
    .describe(
      'Cursor token (from a previous cursor: true response) to fetch the previous page of content types. Only used when cursor: true.',
    ),
  select: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),
  include: z
    .number()
    .optional()
    .describe('Include this many levels of linked entries'),
  order: z.string().optional().describe('Order content types by this field'),
});

type Params = z.infer<typeof ListContentTypesToolParams>;

function summarizeContentTypeItems(
  items: Array<{ sys: { id: string }; fields: unknown[] }>,
) {
  return items.map((contentType) => ({
    ...contentType,
    id: contentType.sys.id,
    fieldsCount: contentType.fields.length,
  }));
}

export function listContentTypesTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
    };

    const contentfulClient = createToolClient(config, args);

    if (args.cursor) {
      // Cursor-based traversal: exhaustive/large-collection path. skip/total
      // don't apply here — pages.next/pages.prev drive continued iteration.
      const contentTypes = await contentfulClient.contentType.getManyWithCursor(
        {
          ...params,
          query: {
            limit: Math.min(args.limit || 10, 10),
            ...(args.pageNext && { pageNext: args.pageNext }),
            ...(args.pagePrev && { pagePrev: args.pagePrev }),
            ...(args.select && { select: args.select }),
            ...(args.include && { include: args.include }),
            ...(args.order && { order: args.order }),
          } as unknown as Parameters<
            typeof contentfulClient.contentType.getManyWithCursor
          >[0]['query'],
        },
      );

      const summarized = summarizeCursorData({
        ...contentTypes,
        items: summarizeContentTypeItems(contentTypes.items),
      });

      return createSuccessResponse('Content types retrieved successfully', {
        contentTypes: summarized,
        limit: contentTypes.limit,
        pages: contentTypes.pages,
      });
    }

    // Existing offset-based path (unchanged behavior).
    const contentTypes = await contentfulClient.contentType.getMany({
      ...params,
      query: {
        limit: Math.min(args.limit || 10, 10),
        skip: args.skip || 0,
        ...(args.select && { select: args.select }),
        ...(args.include && { include: args.include }),
        ...(args.order && { order: args.order }),
      },
    });

    const summarized = summarizeData(
      {
        ...contentTypes,
        items: summarizeContentTypeItems(contentTypes.items),
      },
      {
        maxItems: 10,
        remainingMessage: offsetRemainingMessage('content types'),
      },
    );

    return createSuccessResponse('Content types retrieved successfully', {
      contentTypes: summarized,
      total: contentTypes.total,
      limit: contentTypes.limit,
      skip: contentTypes.skip,
    });
  }

  return withErrorHandling(tool, 'Error listing content types');
}
