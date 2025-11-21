import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const GetEditorInterfaceToolParams = BaseToolSchema.extend({
  contentTypeId: z
    .string()
    .describe(
      'The ID of the content type to retrieve the editor interface for',
    ),
});

type Params = z.infer<typeof GetEditorInterfaceToolParams>;

export function getEditorInterfaceTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      contentTypeId: args.contentTypeId,
    };

    const contentfulClient = createToolClient(config, args);

    const editorInterface = await contentfulClient.editorInterface.get(params);

    return createSuccessResponse('Editor interface retrieved successfully', {
      editorInterface,
    });
  }

  return withErrorHandling(tool, 'Error retrieving editor interface');
}
