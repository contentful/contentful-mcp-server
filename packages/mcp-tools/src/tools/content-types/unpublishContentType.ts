import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const UnpublishContentTypeToolParams = BaseToolSchema.extend({
  contentTypeId: z.string().describe('The ID of the content type to unpublish'),
});

type Params = z.infer<typeof UnpublishContentTypeToolParams>;

export function unpublishContentTypeTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      contentTypeId: args.contentTypeId,
    };

    const contentfulClient = await createToolClient(config, args);

    // Unpublish the content type
    const contentType = await contentfulClient.contentType.unpublish(params);

    return createSuccessResponse('Content type unpublished successfully', {
      contentType,
    });
  }

  return withErrorHandling(tool, 'Error unpublishing content type');
}
