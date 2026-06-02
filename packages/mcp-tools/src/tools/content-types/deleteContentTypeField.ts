import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const DeleteContentTypeFieldToolParams = BaseToolSchema.extend({
  contentTypeId: z
    .string()
    .describe('The ID of the content type containing the field'),
  fieldId: z.string().describe('The ID of the field to delete'),
});

type Params = z.infer<typeof DeleteContentTypeFieldToolParams>;

export function deleteContentTypeFieldTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      contentTypeId: args.contentTypeId,
    };

    const contentfulClient = createToolClient(config, args);

    const currentContentType = await contentfulClient.contentType.get(params);

    const field = currentContentType.fields.find((f) => f.id === args.fieldId);
    if (!field) {
      throw new Error(
        `Field "${args.fieldId}" not found on content type "${args.contentTypeId}"`,
      );
    }

    if (field.required) {
      throw new Error(
        `Field "${args.fieldId}" is required. Set required=false via update_content_type and publish before deleting.`,
      );
    }

    if (!field.omitted) {
      throw new Error(
        `Field "${args.fieldId}" must be omitted and the content type published before it can be deleted. Use omit_content_type_field, then publish_content_type, then retry.`,
      );
    }

    const updatedFields = currentContentType.fields.map((f) =>
      f.id === args.fieldId ? { ...f, deleted: true } : f,
    );

    const updatedContentType = await contentfulClient.contentType.update(
      params,
      { ...currentContentType, fields: updatedFields },
    );

    return createSuccessResponse(
      `Field "${args.fieldId}" marked deleted on content type "${args.contentTypeId}". Publish the content type for the deletion to take effect.`,
      { contentType: updatedContentType },
    );
  }

  return withErrorHandling(tool, 'Error deleting field');
}
