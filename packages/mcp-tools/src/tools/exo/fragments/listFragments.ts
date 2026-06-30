import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../../utils/tools.js';
import { summarizeData } from '../../../utils/summarizer.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const ListFragmentsToolParams = BaseToolSchema.extend({
  limit: z
    .number()
    .optional()
    .describe('Maximum number of fragments to return (max 10)'),
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
    .describe('Order fragments by this field (e.g. sys.createdAt)'),
});

type Params = z.infer<typeof ListFragmentsToolParams>;

export function listFragmentsTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createToolClient(config, args);

    const fragments = await contentfulClient.fragment.getMany({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      query: {
        limit: Math.min(args.limit || 10, 10),
        ...(args.pageNext && { pageNext: args.pageNext }),
        ...(args.pagePrev && { pagePrev: args.pagePrev }),
        ...(args.order && { order: args.order }),
      } as unknown as Parameters<typeof contentfulClient.fragment.getMany>[0]['query'],
    });

    const summarized = summarizeData(fragments, {
      maxItems: 10,
      remainingMessage:
        'To see more fragments, ask me to retrieve the next page using the pageNext cursor.',
    });

    return createSuccessResponse('Fragments retrieved successfully', {
      fragments: summarized,
      total: fragments.total,
      limit: fragments.limit,
      pages: fragments.pages,
    });
  }

  return withErrorHandling(tool, 'Error listing fragments');
}
