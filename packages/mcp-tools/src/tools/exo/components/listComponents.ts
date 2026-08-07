import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../../utils/tools.js';
import { summarizeData } from '../../../utils/summarizer.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const ListComponentsToolParams = BaseToolSchema.extend({
  limit: z
    .number()
    .optional()
    .describe('Maximum number of components to return (max 10)'),
  pageNext: z
    .string()
    .optional()
    .describe('Cursor token to fetch the next page of results'),
  pagePrev: z
    .string()
    .optional()
    .describe('Cursor token to fetch the previous page of results'),
  order: z
    .string()
    .optional()
    .describe('Order components by this field (e.g. sys.createdAt)'),
});

type Params = z.infer<typeof ListComponentsToolParams>;

export function listComponentsTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createToolClient(config, args);

    // CursorPaginationParams is a discriminated union (pageNext/pagePrev are
    // mutually exclusive via `?: never`), so we pick one cursor arm explicitly
    // to satisfy the type without a cast.
    const cursorParam = args.pageNext
      ? { pageNext: args.pageNext }
      : args.pagePrev
        ? { pagePrev: args.pagePrev }
        : {};

    const components = await contentfulClient.component.getMany({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      query: {
        limit: Math.min(args.limit || 10, 10),
        ...(args.order && { order: args.order }),
        ...cursorParam,
      },
    });

    const summarized = summarizeData(components, {
      maxItems: 10,
      remainingMessage:
        'To see more components, ask me to retrieve the next page using the pageNext cursor.',
    });

    return createSuccessResponse('Components retrieved successfully', {
      components: summarized,
      total: components.total,
      limit: components.limit,
      pages: components.pages,
    });
  }

  return withErrorHandling(tool, 'Error listing components');
}
