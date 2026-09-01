import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createExoToolClient } from '../../../utils/tools.js';
import { summarizeData } from '../../../utils/summarizer.js';
import { DTCG_DESIGN_PROPERTY_TYPES } from '../../../types/exoSchemas.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const ListDesignTokensToolParams = BaseToolSchema.extend({
  limit: z
    .number()
    .optional()
    .describe('Maximum number of design tokens to return (max 10)'),
  pageNext: z
    .string()
    .optional()
    .describe('Cursor token to fetch the next page of results'),
  pagePrev: z
    .string()
    .optional()
    .describe('Cursor token to fetch the previous page of results'),
  type: z
    .enum(DTCG_DESIGN_PROPERTY_TYPES)
    .optional()
    .describe('Filter to design tokens of this DTCG type (e.g. DTCG.Color)'),
});

type Params = z.infer<typeof ListDesignTokensToolParams>;

export function listDesignTokensTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createExoToolClient(config, args);

    // CursorPaginationParams is a discriminated union (pageNext/pagePrev are
    // mutually exclusive via `?: never`), so we pick one cursor arm explicitly
    // to satisfy the type without a cast.
    const cursorParam = args.pageNext
      ? { pageNext: args.pageNext }
      : args.pagePrev
        ? { pagePrev: args.pagePrev }
        : {};

    const designTokens = await contentfulClient.designToken.getMany({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      query: {
        limit: Math.min(args.limit || 10, 10),
        ...(args.type && { type: args.type }),
        ...cursorParam,
      },
    });

    const summarized = summarizeData(designTokens, {
      maxItems: 10,
      remainingMessage:
        'To see more design tokens, ask me to retrieve the next page using the pageNext cursor.',
    });

    return createSuccessResponse('Design tokens retrieved successfully', {
      designTokens: summarized,
      total: designTokens.total,
      limit: designTokens.limit,
      pages: designTokens.pages,
    });
  }

  return withErrorHandling(tool, 'Error listing design tokens');
}
