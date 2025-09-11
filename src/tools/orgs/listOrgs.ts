import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import ctfl from 'contentful-management';
import { getDefaultClientConfig } from '../../config/contentful.js';
import { summarizeData } from '../../utils/summarizer.js';

// For listing organizations, we don't need spaceId or environmentId parameters
export const ListOrgsToolParams = z.object({
  limit: z
    .number()
    .optional()
    .describe('Maximum number of organizations to return (max 10)'),
  skip: z
    .number()
    .optional()
    .describe('Skip this many organizations for pagination'),
  select: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),
  order: z.string().optional().describe('Order organizations by this field'),
});

type Params = z.infer<typeof ListOrgsToolParams>;

async function tool(args: Params) {
  // Create a client without space-specific configuration for listing all organizations
  const clientConfig = getDefaultClientConfig();
  // Remove space from config since we're listing organizations at the account level
  delete clientConfig.space;
  const contentfulClient = ctfl.createClient(clientConfig, { type: 'plain' });

  const organizations = await contentfulClient.organization.getAll({
    query: {
      limit: Math.min(args.limit || 10, 10),
      skip: args.skip || 0,
      ...(args.select && { select: args.select }),
      ...(args.order && { order: args.order }),
    },
  });

  const summarizedOrganizations = organizations.items.map((org) => ({
    id: org.sys.id,
    name: org.name,
    createdAt: org.sys.createdAt,
    updatedAt: org.sys.updatedAt,
  }));

  const summarized = summarizeData(
    {
      ...organizations,
      items: summarizedOrganizations,
    },
    {
      maxItems: 10,
      remainingMessage:
        'To see more organizations, please ask me to retrieve the next page using the skip parameter.',
    },
  );

  return createSuccessResponse('Organizations retrieved successfully', {
    organizations: summarized,
    total: organizations.total,
    limit: organizations.limit,
    skip: organizations.skip,
  });
}

export const listOrgsTool = withErrorHandling(
  tool,
  'Error listing organizations',
);
