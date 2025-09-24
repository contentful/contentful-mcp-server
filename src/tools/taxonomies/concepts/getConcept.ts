import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import ctfl from 'contentful-management';
import { getDefaultClientConfig } from '../../../config/contentful.js';

export const GetConceptToolParams = z.object({
  organizationId: z.string().describe('The ID of the Contentful organization'),
  conceptId: z.string().describe('The ID of the concept to retrieve'),
});

type Params = z.infer<typeof GetConceptToolParams>;

async function tool(args: Params) {
  // Create a client without space-specific configuration for concept operations
  const clientConfig = getDefaultClientConfig();
  // Remove space from config since we're working at the organization level
  delete clientConfig.space;
  const contentfulClient = ctfl.createClient(clientConfig, { type: 'plain' });

  const concept = await contentfulClient.concept.get({
    organizationId: args.organizationId,
    conceptId: args.conceptId,
  });

  return createSuccessResponse('Concept retrieved successfully', { concept });
}

export const getConceptTool = withErrorHandling(
  tool,
  'Error retrieving concept',
);
