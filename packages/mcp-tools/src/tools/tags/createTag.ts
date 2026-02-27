import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const CreateTagToolParams = BaseToolSchema.extend({
  name: z.string().describe('The name of the tag'),
  id: z.string().describe('The ID of the tag'),
  visibility: z
    .enum(['public', 'private'])
    .describe('The visibility of the tag. Default to private if not specified'),
});

type Params = z.infer<typeof CreateTagToolParams>;

export function createTagTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      tagId: args.id,
    };

    const contentfulClient = await createToolClient(config, args);

  const newTag = await contentfulClient.tag.createWithId(params, {
    name: args.name,
    sys: { visibility: args.visibility },
  });

    return createSuccessResponse('Tag created successfully', { newTag });
  }

  return withErrorHandling(tool, 'Error creating tag');
}
