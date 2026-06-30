import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const GetExperienceToolParams = BaseToolSchema.extend({
  experienceId: z.string().describe('The ID of the experience to retrieve'),
});

type Params = z.infer<typeof GetExperienceToolParams>;

export function getExperienceTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createToolClient(config, args);

    const experience = await contentfulClient.experience.get({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      experienceId: args.experienceId,
    });

    return createSuccessResponse('Experience retrieved successfully', {
      experience,
    });
  }

  return withErrorHandling(tool, 'Error retrieving experience');
}
