import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const UnpublishContentTypeToolParams = BaseToolSchema.extend({
  contentTypeId: z.string().describe('The ID of the content type to unpublish'),
});

type Params = z.infer<typeof UnpublishContentTypeToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
    contentTypeId: args.contentTypeId,
  };

  const contentfulClient = createToolClient(args);

  // Unpublish the content type
  const contentType = await contentfulClient.contentType.unpublish(params);

  return createSuccessResponse('Content type unpublished successfully', 
    { contentType });
}

export const unpublishContentTypeTool = withErrorHandling(
  tool,
  'Error unpublishing content type',
); 