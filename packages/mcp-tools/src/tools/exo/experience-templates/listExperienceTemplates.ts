import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../../utils/tools.js';
import { summarizeData } from '../../../utils/summarizer.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const ListExperienceTemplatesToolParams = BaseToolSchema.extend({
  limit: z
    .number()
    .optional()
    .describe('Maximum number of experience templates to return (max 10)'),
  pageNext: z
    .string()
    .optional()
    .describe('Cursor token to fetch the next page of results'),
  pagePrev: z
    .string()
    .optional()
    .describe('Cursor token to fetch the previous page of results'),
  order: z
    .string()
    .optional()
    .describe('Order experience templates by this field (e.g. sys.createdAt)'),
});

type Params = z.infer<typeof ListExperienceTemplatesToolParams>;

export function listExperienceTemplatesTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createToolClient(config, args);

    const experienceTemplates =
      await contentfulClient.experienceTemplate.getMany({
        spaceId: args.spaceId,
        environmentId: args.environmentId,
        query: {
          limit: Math.min(args.limit || 10, 10),
          ...(args.pageNext && { pageNext: args.pageNext }),
          ...(args.pagePrev && { pagePrev: args.pagePrev }),
          ...(args.order && { order: args.order }),
        } as unknown as Parameters<
          typeof contentfulClient.experienceTemplate.getMany
        >[0]['query'],
      });

    const summarized = summarizeData(experienceTemplates, {
      maxItems: 10,
      remainingMessage:
        'To see more experience templates, ask me to retrieve the next page using the pageNext cursor.',
    });

    return createSuccessResponse('ExperienceTemplates retrieved successfully', {
      experienceTemplates: summarized,
      total: experienceTemplates.total,
      limit: experienceTemplates.limit,
      pages: experienceTemplates.pages,
    });
  }

  return withErrorHandling(tool, 'Error listing experience templates');
}
