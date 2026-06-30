import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../../utils/tools.js';
import { summarizeData } from '../../../utils/summarizer.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const ListDataAssembliesToolParams = BaseToolSchema.extend({
  limit: z
    .number()
    .optional()
    .describe('Maximum number of data assemblies to return (max 10)'),
  pageNext: z
    .string()
    .optional()
    .describe('Cursor token to fetch the next page of results'),
  pagePrev: z
    .string()
    .optional()
    .describe('Cursor token to fetch the previous page of results'),
  'sys.id[in]': z
    .string()
    .optional()
    .describe('Comma-separated list of data assembly IDs to filter by'),
});

type Params = z.infer<typeof ListDataAssembliesToolParams>;

export function listDataAssembliesTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createToolClient(config, args);

    const dataAssemblies = await contentfulClient.dataAssembly.getMany({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      query: {
        limit: Math.min(args.limit || 10, 10),
        ...(args.pageNext && { pageNext: args.pageNext }),
        ...(args.pagePrev && { pagePrev: args.pagePrev }),
        ...(args['sys.id[in]'] && { 'sys.id[in]': args['sys.id[in]'] }),
      } as unknown as Parameters<typeof contentfulClient.dataAssembly.getMany>[0]['query'],
    });

    const summarized = summarizeData(dataAssemblies, {
      maxItems: 10,
      remainingMessage:
        'To see more data assemblies, ask me to retrieve the next page using the pageNext cursor.',
    });

    return createSuccessResponse('Data assemblies retrieved successfully', {
      dataAssemblies: summarized,
      total: dataAssemblies.total,
      pages: dataAssemblies.pages,
    });
  }

  return withErrorHandling(tool, 'Error listing data assemblies');
}
