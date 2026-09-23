import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const GetReleaseToolParams = BaseToolSchema.extend({
  releaseId: z.string().describe('The ID of the release to retrieve'),
});

type Params = z.infer<typeof GetReleaseToolParams>;

export function getReleaseTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      releaseId: args.releaseId,
    };

    const contentfulClient = createToolClient(config, args);

    const release = await contentfulClient.release.get(params);

    return createSuccessResponse('Release retrieved successfully', {
      release,
    });
  }

  return withErrorHandling(tool, 'Error retrieving release');
}
