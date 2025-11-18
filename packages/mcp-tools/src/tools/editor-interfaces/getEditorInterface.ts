import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const GetEditorInterfaceToolParams = BaseToolSchema.extend({
  contentTypeId: z
    .string()
    .describe(
      'The ID of the content type to retrieve the editor interface for',
    ),
});

type Params = z.infer<typeof GetEditorInterfaceToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
    contentTypeId: args.contentTypeId,
  };

  const contentfulClient = createToolClient(args);

  const editorInterface = await contentfulClient.editorInterface.get(params);

  return createSuccessResponse('Editor interface retrieved successfully', {
    editorInterface,
  });
}

export const getEditorInterfaceTool = withErrorHandling(
  tool,
  'Error retrieving editor interface',
);
