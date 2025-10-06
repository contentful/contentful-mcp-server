import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import ctfl from 'contentful-management';
import { getDefaultClientConfig } from '../../../config/contentful.js';

export const GetConceptSchemeToolParams = z.object({
  organizationId: z.string().describe('The ID of the Contentful organization'),
  conceptSchemeId: z
    .string()
    .describe('The ID of the concept scheme to retrieve'),
});

type Params = z.infer<typeof GetConceptSchemeToolParams>;

async function tool(args: Params) {
  // Create a client without space-specific configuration for concept scheme operations
  const clientConfig = getDefaultClientConfig();
  // Remove space from config since we're working at the organization level
  delete clientConfig.space;
  const contentfulClient = ctfl.createClient(clientConfig, { type: 'plain' });

  const params = {
    organizationId: args.organizationId,
    conceptSchemeId: args.conceptSchemeId,
  };

  // Get the concept scheme
  const conceptScheme = await contentfulClient.conceptScheme.get(params);

  return createSuccessResponse('Concept scheme retrieved successfully', {
    conceptScheme,
  });
}

export const getConceptSchemeTool = withErrorHandling(
  tool,
  'Error retrieving concept scheme',
);
