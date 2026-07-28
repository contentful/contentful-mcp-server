import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../../utils/tools.js';
import { summarizeData } from '../../../utils/summarizer.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const ListTemplatesToolParams = BaseToolSchema.extend({
  limit: z
    .number()
    .optional()
    .describe('Maximum number of templates to return (max 10)'),
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
    .describe('Order templates by this field (e.g. sys.createdAt)'),
});

type Params = z.infer<typeof ListTemplatesToolParams>;

export function listTemplatesTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createToolClient(config, args);

    const templates = await contentfulClient.template.getMany({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      query: {
        limit: Math.min(args.limit || 10, 10),
        ...(args.pageNext && { pageNext: args.pageNext }),
        ...(args.pagePrev && { pagePrev: args.pagePrev }),
        ...(args.order && { order: args.order }),
      } as unknown as Parameters<
        typeof contentfulClient.template.getMany
      >[0]['query'],
    });

    const summarized = summarizeData(templates, {
      maxItems: 10,
      remainingMessage:
        'To see more templates, ask me to retrieve the next page using the pageNext cursor.',
    });

    return createSuccessResponse('Templates retrieved successfully', {
      templates: summarized,
      total: templates.total,
      limit: templates.limit,
      pages: templates.pages,
    });
  }

  return withErrorHandling(tool, 'Error listing templates');
}
