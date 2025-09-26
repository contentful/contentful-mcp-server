import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import ctfl from 'contentful-management';
import { getDefaultClientConfig } from '../../config/contentful.js';
import { summarizeData } from '../../utils/summarizer.js';

// For listing spaces, we don't need spaceId or environmentId parameters
export const ListSpacesToolParams = z.object({
  limit: z
    .number()
    .optional()
    .describe('Maximum number of spaces to return (max 10)'),
  skip: z.number().optional().describe('Skip this many spaces for pagination'),
  select: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),
  order: z.string().optional().describe('Order spaces by this field'),
});

type Params = z.infer<typeof ListSpacesToolParams>;

async function tool(args: Params) {
  // Create a client without space-specific configuration for listing all spaces
  const clientConfig = getDefaultClientConfig();
  // Remove space from config since we're listing all spaces
  delete clientConfig.space;
  const contentfulClient = ctfl.createClient(clientConfig, { type: 'plain' });

  const spaces = await contentfulClient.space.getMany({
    query: {
      limit: Math.min(args.limit || 10, 10),
      skip: args.skip || 0,
      ...(args.select && { select: args.select }),
      ...(args.order && { order: args.order }),
    },
  });

  const summarizedSpaces = spaces.items.map((space) => ({
    id: space.sys.id,
    name: space.name,
    createdAt: space.sys.createdAt,
    updatedAt: space.sys.updatedAt,
  }));

  const summarized = summarizeData(
    {
      ...spaces,
      items: summarizedSpaces,
    },
    {
      maxItems: 10,
      remainingMessage:
        'To see more spaces, please ask me to retrieve the next page using the skip parameter.',
    },
  );

  return createSuccessResponse('Spaces retrieved successfully', {
    spaces: summarized,
    total: spaces.total,
    limit: spaces.limit,
    skip: spaces.skip,
  });
}

export const listSpacesTool = withErrorHandling(tool, 'Error listing spaces');
