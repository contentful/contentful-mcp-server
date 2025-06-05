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
    },
  });

  const summarizedContentTypes = contentTypes.items.map(contentType => ({
    ...contentType,
    id : contentType.sys.id,
    fieldsCount: contentType.fields.length 
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
    }
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