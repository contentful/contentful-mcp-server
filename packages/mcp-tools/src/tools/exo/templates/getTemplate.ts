import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const GetTemplateToolParams = BaseToolSchema.extend({
  templateId: z.string().describe('The ID of the template to retrieve details for'),
});

type Params = z.infer<typeof GetTemplateToolParams>;

export function getTemplateTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createToolClient(config, args);

    const template = await contentfulClient.template.get({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      templateId: args.templateId,
    });

    return createSuccessResponse('Template retrieved successfully', {
      template,
    });
  }

  return withErrorHandling(tool, 'Error retrieving template');
}
