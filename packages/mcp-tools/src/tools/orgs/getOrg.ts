import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import ctfl from 'contentful-management';
import { getDefaultClientConfig } from '../../config/contentful.js';

export const GetOrgToolParams = z.object({
  organizationId: z.string().describe('The ID of the organization to retrieve'),
});

type Params = z.infer<typeof GetOrgToolParams>;

async function tool(args: Params) {
  // Create a client without space-specific configuration
  const clientConfig = getDefaultClientConfig();
  // Remove space from config since we're working at the organization level
  delete clientConfig.space;
  const contentfulClient = ctfl.createClient(clientConfig, { type: 'plain' });

  // Get the organization
  const organization = await contentfulClient.organization.get({
    organizationId: args.organizationId,
  });

  return createSuccessResponse('Organization retrieved successfully', {
    organization,
  });
}

export const getOrgTool = withErrorHandling(
  tool,
  'Error retrieving organization',
);
