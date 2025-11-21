import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const PublishContentTypeToolParams = BaseToolSchema.extend({
  contentTypeId: z.string().describe('The ID of the content type to publish'),
});

type Params = z.infer<typeof PublishContentTypeToolParams>;

export function publishContentTypeTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      contentTypeId: args.contentTypeId,
    };

    const contentfulClient = createToolClient(config, args);

    // Get the content type first
    const currentContentType = await contentfulClient.contentType.get(params);

    // Publish the content type
    const contentType = await contentfulClient.contentType.publish(
      params,
      currentContentType,
    );

    return createSuccessResponse('Content type published successfully', {
      contentType,
    });
  }

  return withErrorHandling(tool, 'Error publishing content type');
}
