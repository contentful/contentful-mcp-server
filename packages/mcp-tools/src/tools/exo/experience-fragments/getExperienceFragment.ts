import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createExoToolClient } from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const GetExperienceFragmentToolParams = BaseToolSchema.extend({
  experienceFragmentId: z
    .string()
    .describe('The ID of the experience fragment to retrieve details for'),
});

type Params = z.infer<typeof GetExperienceFragmentToolParams>;

export function getExperienceFragmentTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createExoToolClient(config, args);

    const experienceFragment = await contentfulClient.experienceFragment.get({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      experienceFragmentId: args.experienceFragmentId,
    });

    return createSuccessResponse('Experience fragment retrieved successfully', {
      experienceFragment,
    });
  }

  return withErrorHandling(tool, 'Error retrieving experience fragment');
}
