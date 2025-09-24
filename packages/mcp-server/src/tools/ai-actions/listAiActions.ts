import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { summarizeData } from '../../utils/summarizer.js';

export const ListAiActionToolParams = BaseToolSchema.extend({
  limit: z
    .number()
    .optional()
    .describe('Maximum number of AI actions to return (max 3)'),
  skip: z
    .number()
    .optional()
    .describe('Skip this many AI actions for pagination'),
  select: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),
  include: z
    .number()
    .optional()
    .describe('Include this many levels of linked entries'),
  order: z.string().optional().describe('Order AI actions by this field'),
});

type Params = z.infer<typeof ListAiActionToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  const aiActions = await contentfulClient.aiAction.getMany({
    ...params,
    query: {
      limit: Math.min(args.limit || 3, 3),
      skip: args.skip || 0,
      ...(args.select && { select: args.select }),
      ...(args.include && { include: args.include }),
      ...(args.order && { order: args.order }),
    },
  });

  const summarizedAiActions = aiActions.items.map((aiAction) => ({
    id: aiAction.sys.id,
    name: aiAction.name || 'Untitled',
    description: aiAction.description || null,
    instruction: aiAction.instruction || null,
    configuration: aiAction.configuration || null,
    testCases: aiAction.testCases || null,
    createdAt: aiAction.sys.createdAt,
    updatedAt: aiAction.sys.updatedAt,
    publishedVersion: aiAction.sys.publishedVersion,
  }));

  const summarized = summarizeData(
    {
      ...aiActions,
      items: summarizedAiActions,
    },
    {
      maxItems: 3,
      remainingMessage:
        'To see more AI actions, please ask me to retrieve the next page using the skip parameter.',
    },
  );

  return createSuccessResponse('AI actions retrieved successfully', {
    aiActions: summarized,
    total: aiActions.total,
    limit: aiActions.limit,
    skip: aiActions.skip,
  });
}

export const listAiActionTool = withErrorHandling(
  tool,
  'Error listing AI actions',
);
