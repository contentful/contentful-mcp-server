import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createExoToolClient } from '../../../utils/tools.js';
import { summarizeData } from '../../../utils/summarizer.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const ListExperienceFragmentsToolParams = BaseToolSchema.extend({
  limit: z
    .number()
    .optional()
    .describe('Maximum number of experience fragments to return (max 10)'),
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
    .describe('Order experience fragments by this field (e.g. sys.createdAt)'),
});

type Params = z.infer<typeof ListExperienceFragmentsToolParams>;

export function listExperienceFragmentsTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createExoToolClient(config, args);

    const experienceFragments =
      await contentfulClient.experienceFragment.getMany({
        spaceId: args.spaceId,
        environmentId: args.environmentId,
        query: {
          limit: Math.min(args.limit || 10, 10),
          ...(args.pageNext && { pageNext: args.pageNext }),
          ...(args.pagePrev && { pagePrev: args.pagePrev }),
          ...(args.order && { order: args.order }),
        } as unknown as Parameters<
          typeof contentfulClient.experienceFragment.getMany
        >[0]['query'],
      });

    const summarized = summarizeData(experienceFragments, {
      maxItems: 10,
      remainingMessage:
        'To see more experience fragments, ask me to retrieve the next page using the pageNext cursor.',
    });

    return createSuccessResponse('ExperienceFragments retrieved successfully', {
      experienceFragments: summarized,
      total: experienceFragments.total,
      limit: experienceFragments.limit,
      pages: experienceFragments.pages,
    });
  }

  return withErrorHandling(tool, 'Error listing experience fragments');
}
