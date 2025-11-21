import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const DeleteContentTypeToolParams = BaseToolSchema.extend({
  contentTypeId: z.string().describe('The ID of the content type to delete'),
});

type Params = z.infer<typeof DeleteContentTypeToolParams>;

export function deleteContentTypeTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      contentTypeId: args.contentTypeId,
    };

    const contentfulClient = createToolClient(config, args);

    // Delete the content type
    await contentfulClient.contentType.delete(params);

    return createSuccessResponse('Content type deleted successfully', {
      contentTypeId: args.contentTypeId,
    });
  }

  return withErrorHandling(tool, 'Error deleting content type');
}
