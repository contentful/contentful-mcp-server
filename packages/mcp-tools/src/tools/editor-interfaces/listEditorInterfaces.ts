import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { summarizeData } from '../../utils/summarizer.js';

export const ListEditorInterfacesToolParams = BaseToolSchema.extend({});

type Params = z.infer<typeof ListEditorInterfacesToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  const editorInterfaces =
    await contentfulClient.editorInterface.getMany(params);

  const summarizedInterfaces = editorInterfaces.items.map(
    (editorInterface) => ({
      contentTypeId: editorInterface.sys.contentType.sys.id,
      version: editorInterface.sys.version,
      controlsCount: editorInterface.controls?.length || 0,
    }),
  );

  const summarized = summarizeData(
    {
      ...editorInterfaces,
      items: summarizedInterfaces,
    },
    {
      maxItems: 20,
      remainingMessage:
        'This list includes all editor interfaces in the environment.',
    },
  );

  return createSuccessResponse('Editor interfaces retrieved successfully', {
    editorInterfaces: summarized,
    total: editorInterfaces.total,
    limit: editorInterfaces.limit,
    skip: editorInterfaces.skip,
  });
}

export const listEditorInterfacesTool = withErrorHandling(
  tool,
  'Error listing editor interfaces',
);
