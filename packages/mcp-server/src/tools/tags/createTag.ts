import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const CreateTagToolParams = BaseToolSchema.extend({
  name: z.string().describe('The name of the tag'),
  id: z.string().describe('The ID of the tag'),
  visibility: z
    .enum(['public', 'private'])
    .describe('The visibility of the tag. Default to private if not specified'),
});

type Params = z.infer<typeof CreateTagToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
    tagId: args.id,
  };

  const contentfulClient = createToolClient(args);

  let newTag = await contentfulClient.tag.createWithId(params, {
    name: args.name,
    sys: { visibility: args.visibility },
  });

  return createSuccessResponse('Tag created successfully', { newTag });
}

export const createTagTool = withErrorHandling(tool, 'Error creating tag');
