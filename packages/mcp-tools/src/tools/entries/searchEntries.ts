import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { summarizeData } from '../../utils/summarizer.js';

export const SearchEntriesToolParams = BaseToolSchema.extend({
  query: z.object({
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
      .describe('Maximum number of entries to return'),
    skip: z.number().optional().describe('Skip this many entries'),
    order: z.string().optional().describe('Order entries by this field'),
  }),
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
      limit: Math.min(args.query.limit || 3, 3),
      skip: args.query.skip || 0,
    },
  });

  const summarized = summarizeData(entries, {
    maxItems: 3,
    remainingMessage:
      'To see more entries, please ask me to retrieve the next page.',
  });

  return createSuccessResponse('Entries retrieved successfully', {
    entries: summarized,
  });
}

export const searchEntriesTool = withErrorHandling(
  tool,
  'Error deleting dataset',
);
