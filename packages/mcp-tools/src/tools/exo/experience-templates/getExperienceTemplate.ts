import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const GetExperienceTemplateToolParams = BaseToolSchema.extend({
  experienceTemplateId: z
    .string()
    .describe('The ID of the experience template to retrieve details for'),
});

type Params = z.infer<typeof GetExperienceTemplateToolParams>;

export function getExperienceTemplateTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createToolClient(config, args);

    const experienceTemplate = await contentfulClient.experienceTemplate.get({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      experienceTemplateId: args.experienceTemplateId,
    });

    return createSuccessResponse('Experience template retrieved successfully', {
      experienceTemplate,
    });
  }

  return withErrorHandling(tool, 'Error retrieving experience template');
}
