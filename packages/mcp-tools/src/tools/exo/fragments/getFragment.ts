import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const GetFragmentToolParams = BaseToolSchema.extend({
  fragmentId: z.string().describe('The ID of the fragment to retrieve details for'),
});

type Params = z.infer<typeof GetFragmentToolParams>;

export function getFragmentTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createToolClient(config, args);

    const fragment = await contentfulClient.fragment.get({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      fragmentId: args.fragmentId,
    });

    return createSuccessResponse('Fragment retrieved successfully', {
      fragment,
    });
  }

  return withErrorHandling(tool, 'Error retrieving fragment');
}
