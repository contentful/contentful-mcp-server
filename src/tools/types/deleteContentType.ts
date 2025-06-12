import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const DeleteContentTypeToolParams = BaseToolSchema.extend({
  contentTypeId: z.string().describe('The ID of the content type to delete'),
});

type Params = z.infer<typeof DeleteContentTypeToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
    contentTypeId: args.contentTypeId,
  };

  const contentfulClient = createToolClient(args);

  // Delete the content type
  await contentfulClient.contentType.delete(params);

  return createSuccessResponse('Content type deleted successfully', 
    { contentTypeId: args.contentTypeId });
}

export const deleteContentTypeTool = withErrorHandling(
  tool,
  'Error deleting content type',
); 