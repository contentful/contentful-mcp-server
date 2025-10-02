import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const GetContentTypeToolParams = BaseToolSchema.extend({
  contentTypeId: z
    .string()
    .describe('The ID of the content type to retrieve details for'),
});

type Params = z.infer<typeof GetContentTypeToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  // Get the content type details
  const contentType = await contentfulClient.contentType.get({
    ...params,
    contentTypeId: args.contentTypeId,
  });

  return createSuccessResponse('Content type retrieved successfully', {
    contentType,
  });
}

export const getContentTypeTool = withErrorHandling(
  tool,
  'Error retrieving content type',
);
