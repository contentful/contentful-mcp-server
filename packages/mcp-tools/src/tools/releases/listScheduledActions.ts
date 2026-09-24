import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { summarizeData } from '../../utils/summarizer.js';
import type { ContentfulConfig } from '../../config/types.js';

const MAX_ITEMS = 10;

export const ListScheduledActionsToolParams = BaseToolSchema.extend({
  releaseId: z
    .string()
    .optional()
    .describe('Filter by the release this scheduled action targets'),
  statusIn: z
    .string()
    .optional()
    .describe(
      'Comma-separated list of statuses to include (scheduled, inProgress, succeeded, failed, canceled)',
    ),
  statusNin: z
    .string()
    .optional()
    .describe('Comma-separated list of statuses to exclude'),
  limit: z
    .number()
    .optional()
    .describe('Maximum number of scheduled actions to return (max 10)'),
});

type Params = z.infer<typeof ListScheduledActionsToolParams>;

export function listScheduledActionsTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createToolClient(config, args);

    const scheduledActions = await contentfulClient.scheduledActions.getMany({
      spaceId: args.spaceId,
      query: {
        'environment.sys.id': args.environmentId,
        limit: Math.max(1, Math.min(args.limit ?? MAX_ITEMS, MAX_ITEMS)),
        ...(args.releaseId && { 'entity.sys.id': args.releaseId }),
        ...(args.statusIn && { 'sys.status[in]': args.statusIn }),
        ...(args.statusNin && { 'sys.status[nin]': args.statusNin }),
      },
    });

    const summarized = summarizeData(scheduledActions, {
      maxItems: MAX_ITEMS,
      remainingMessage:
        'To see more scheduled actions, narrow your filters or ask for a smaller limit.',
    });

    return createSuccessResponse('Scheduled actions retrieved successfully', {
      scheduledActions: summarized,
    });
  }

  return withErrorHandling(tool, 'Error listing scheduled actions');
}
