import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const OmitAndDeleteContentTypeFieldToolParams = BaseToolSchema.extend({
  contentTypeId: z
    .string()
    .describe('The ID of the content type containing the field'),
  fieldId: z.string().describe('The ID of the field to omit and delete'),
});

type Params = z.infer<typeof OmitAndDeleteContentTypeFieldToolParams>;

export function omitAndDeleteContentTypeFieldTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      contentTypeId: args.contentTypeId,
    };

    const contentfulClient = createToolClient(config, args);

    // Step 1: fetch current content type
    const currentContentType = await contentfulClient.contentType.get(params);

    const field = currentContentType.fields.find((f) => f.id === args.fieldId);
    if (!field) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Error omitting and deleting field: Field "${args.fieldId}" not found on content type "${args.contentTypeId}"`,
          },
        ],
      };
    }

    // Step 2: set omitted=true, update, then publish
    const omittedFields = currentContentType.fields.map((f) =>
      f.id === args.fieldId ? { ...f, omitted: true } : f,
    );
    const omittedContentType = await contentfulClient.contentType.update(
      params,
      { ...currentContentType, fields: omittedFields },
    );
    const publishedContentType = await contentfulClient.contentType.publish(
      params,
      omittedContentType,
    );

    // Step 3: set deleted=true, update (no re-publish required)
    const deletedFields = publishedContentType.fields.map((f) =>
      f.id === args.fieldId ? { ...f, deleted: true } : f,
    );
    const finalContentType = await contentfulClient.contentType.update(params, {
      ...publishedContentType,
      fields: deletedFields,
    });

    return createSuccessResponse(
      `Field "${args.fieldId}" has been omitted and deleted from content type "${args.contentTypeId}"`,
      { contentType: finalContentType },
    );
  }

  return withErrorHandling(tool, 'Error omitting and deleting field');
}
