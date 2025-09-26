import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { summarizeData } from '../../utils/summarizer.js';

// Extend BaseToolSchema but make environmentId optional since it's not needed for listing
export const ListEnvironmentsToolParams = BaseToolSchema.extend({
  environmentId: z
    .string()
    .optional()
    .describe(
      'The ID of the Contentful environment (not required for listing)',
    ),
  limit: z
    .number()
    .optional()
    .describe('Maximum number of environments to return (max 10)'),
  skip: z
    .number()
    .optional()
    .describe('Skip this many environments for pagination'),
  select: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),
  order: z.string().optional().describe('Order environments by this field'),
});

type Params = z.infer<typeof ListEnvironmentsToolParams>;

async function tool(args: Params) {
  const clientArgs = {
    spaceId: args.spaceId,
    environmentId: args.environmentId || 'master',
  };

  const contentfulClient = createToolClient(clientArgs);

  const environments = await contentfulClient.environment.getMany({
    spaceId: args.spaceId,
    query: {
      limit: Math.min(args.limit || 10, 10),
      skip: args.skip || 0,
      ...(args.select && { select: args.select }),
      ...(args.order && { order: args.order }),
    },
  });

  const summarizedEnvironments = environments.items.map((environment) => ({
    id: environment.sys.id,
    name: environment.name,
    status: environment.sys.status?.sys?.id || 'unknown',
    createdAt: environment.sys.createdAt,
    updatedAt: environment.sys.updatedAt,
  }));

  const summarized = summarizeData(
    {
      ...environments,
      items: summarizedEnvironments,
    },
    {
      maxItems: 10,
      remainingMessage:
        'To see more environments, please ask me to retrieve the next page using the skip parameter.',
    },
  );

  return createSuccessResponse('Environments retrieved successfully', {
    environments: summarized,
    total: environments.total,
    limit: environments.limit,
    skip: environments.skip,
  });
}

export const listEnvironmentsTool = withErrorHandling(
  tool,
  'Error listing environments',
);
