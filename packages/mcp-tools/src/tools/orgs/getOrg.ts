import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import * as ctfl from 'contentful-management';
import { createClientConfig } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const GetOrgToolParams = z.object({
  organizationId: z.string().describe('The ID of the organization to retrieve'),
});

type Params = z.infer<typeof GetOrgToolParams>;

export function getOrgTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    // Create a client without space-specific configuration
    const clientConfig = createClientConfig(config);
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

  return withErrorHandling(tool, 'Error retrieving organization');
}
