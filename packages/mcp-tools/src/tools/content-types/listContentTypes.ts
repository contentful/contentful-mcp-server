import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { summarizeData } from '../../utils/summarizer.js';

export const ListContentTypesToolParams = BaseToolSchema.extend({
  limit: z
    .number()
    .optional()
    .describe('Maximum number of content types to return (max 10)'),
  skip: z
    .number()
    .optional()
    .describe('Skip this many content types for pagination'),
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

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

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

  const summarizedContentTypes = contentTypes.items.map((contentType) => ({
    ...contentType,
    id: contentType.sys.id,
    fieldsCount: contentType.fields.length,
  }));

  const summarized = summarizeData(
    {
      ...contentTypes,
      items: summarizedContentTypes,
    },
    {
      maxItems: 10,
      remainingMessage:
        'To see more content types, please ask me to retrieve the next page using the skip parameter.',
    },
  );

  return createSuccessResponse('Content types retrieved successfully', {
    contentTypes: summarized,
    total: contentTypes.total,
    limit: contentTypes.limit,
    skip: contentTypes.skip,
  });
}

export const listContentTypesTool = withErrorHandling(
  tool,
  'Error listing content types',
);
