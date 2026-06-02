import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const OmitContentTypeFieldToolParams = BaseToolSchema.extend({
  contentTypeId: z
    .string()
    .describe('The ID of the content type containing the field'),
  fieldId: z.string().describe('The ID of the field to omit'),
  omitted: z
    .boolean()
    .default(true)
    .describe(
      'Whether the field should be omitted. Defaults to true. Set to false to un-omit a field.',
    ),
});

type Params = z.infer<typeof OmitContentTypeFieldToolParams>;

export function omitContentTypeFieldTool(config: ContentfulConfig) {
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

    const updatedFields = currentContentType.fields.map((f) =>
      f.id === args.fieldId ? { ...f, omitted: args.omitted } : f,
    );

    const updatedContentType = await contentfulClient.contentType.update(
      params,
      { ...currentContentType, fields: updatedFields },
    );

    return createSuccessResponse(
      `Field "${args.fieldId}" updated (omitted=${args.omitted}) on content type "${args.contentTypeId}". Publish the content type for the change to take effect.`,
      { contentType: updatedContentType },
    );
  }

  return withErrorHandling(tool, 'Error omitting field');
}
