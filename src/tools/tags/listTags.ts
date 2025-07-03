import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { summarizeData } from '../../utils/summarizer.js';

export const ListTagsToolParams = BaseToolSchema.extend({
  limit: z.number().optional().describe('Maximum number of tags to return'),
  skip: z.number().optional().describe('Skip this many tags for pagination'),
  select: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),
  order: z.string().optional().describe('Order tags by this field'),
});

type Params = z.infer<typeof ListTagsToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  const tags = await contentfulClient.tag.getMany({
    ...params,
    query: {
      limit: args.limit || 100,
      skip: args.skip || 0,
      ...(args.select && { select: args.select }),
      ...(args.order && { order: args.order }),
    },
  });

  const summarizedTags = tags.items.map((tag) => ({
    id: tag.sys.id,
    name: tag.name,
    visibility: tag.sys.visibility,
    createdAt: tag.sys.createdAt,
    updatedAt: tag.sys.updatedAt,
  }));

  const summarized = summarizeData(
    {
      ...tags,
      items: summarizedTags,
    },
    {
      maxItems: 100,
      remainingMessage:
        'To see more tags, please ask me to retrieve the next page using the skip parameter.',
    },
  );

  return createSuccessResponse('Tags retrieved successfully', {
    tags: summarized,
    total: tags.total,
    limit: tags.limit,
    skip: tags.skip,
  });
}

export const listTagsTool = withErrorHandling(tool, 'Error listing tags');
