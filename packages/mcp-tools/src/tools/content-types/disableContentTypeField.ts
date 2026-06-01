import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const DisableContentTypeFieldToolParams = BaseToolSchema.extend({
  contentTypeId: z
    .string()
    .describe('The ID of the content type containing the field'),
  fieldId: z.string().describe('The ID of the field to update'),
  disabled: z
    .boolean()
    .optional()
    .describe(
      'Set to true to disable the field in the editor UI (editors cannot edit it), false to re-enable',
    ),
  omitted: z
    .boolean()
    .optional()
    .describe(
      'Set to true to omit the field from API responses, false to include it again',
    ),
});

type Params = z.infer<typeof DisableContentTypeFieldToolParams>;

export function disableContentTypeFieldTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    if (args.disabled === undefined && args.omitted === undefined) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: 'Error updating field: At least one of "disabled" or "omitted" must be provided',
          },
        ],
      };
    }

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      contentTypeId: args.contentTypeId,
    };

    const contentfulClient = createToolClient(config, args);

    const currentContentType = await contentfulClient.contentType.get(params);

    const field = currentContentType.fields.find((f) => f.id === args.fieldId);
    if (!field) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Error updating field: Field "${args.fieldId}" not found on content type "${args.contentTypeId}"`,
          },
        ],
      };
    }

    const updatedFields = currentContentType.fields.map((f) => {
      if (f.id !== args.fieldId) return f;
      return {
        ...f,
        ...(args.disabled !== undefined && { disabled: args.disabled }),
        ...(args.omitted !== undefined && { omitted: args.omitted }),
      };
    });

    const updatedContentType = await contentfulClient.contentType.update(
      params,
      { ...currentContentType, fields: updatedFields },
    );

    const changes: string[] = [];
    if (args.disabled !== undefined) changes.push(`disabled=${args.disabled}`);
    if (args.omitted !== undefined) changes.push(`omitted=${args.omitted}`);

    return createSuccessResponse(
      `Field "${args.fieldId}" updated (${changes.join(', ')}) on content type "${args.contentTypeId}"`,
      { contentType: updatedContentType },
    );
  }

  return withErrorHandling(tool, 'Error updating field');
}
