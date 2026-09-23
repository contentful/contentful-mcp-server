import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { summarizeData } from '../../utils/summarizer.js';
import type { ContentfulConfig } from '../../config/types.js';

export const ListReleaseActionsToolParams = BaseToolSchema.extend({
  releaseId: z
    .string()
    .optional()
    .describe('Comma-separated list of release IDs to filter actions by'),
  action: z
    .enum(['publish', 'unpublish', 'validate'])
    .optional()
    .describe('Filter by release action type'),
  statusIn: z
    .string()
    .optional()
    .describe(
      'Comma-separated list of statuses to include (created, inProgress, succeeded, failed)',
    ),
  statusNin: z
    .string()
    .optional()
    .describe(
      'Comma-separated list of statuses to exclude (created, inProgress, succeeded, failed)',
    ),
  limit: z
    .number()
    .optional()
    .describe('Maximum number of release actions to return'),
});

type Params = z.infer<typeof ListReleaseActionsToolParams>;

export function listReleaseActionsTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createToolClient(config, args);

    const releaseActions = await contentfulClient.releaseAction.getMany({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      query: {
        ...(args.releaseId && { 'sys.release.sys.id[in]': args.releaseId }),
        ...(args.action && { action: args.action }),
        ...(args.statusIn && { 'sys.status[in]': args.statusIn }),
        ...(args.statusNin && { 'sys.status[nin]': args.statusNin }),
        ...(args.limit && { limit: args.limit }),
      },
    });

    const summarized = summarizeData(releaseActions, {
      maxItems: 10,
      remainingMessage:
        'To see more release actions, narrow your filters or ask for a smaller limit.',
    });

    return createSuccessResponse('Release actions retrieved successfully', {
      releaseActions: summarized,
    });
  }

  return withErrorHandling(tool, 'Error listing release actions');
}
