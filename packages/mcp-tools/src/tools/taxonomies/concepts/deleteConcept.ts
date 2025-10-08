import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import ctfl from 'contentful-management';
import { getDefaultClientConfig } from '../../../config/contentful.js';

export const DeleteConceptToolParams = z.object({
  organizationId: z.string().describe('The ID of the Contentful organization'),
  conceptId: z.string().describe('The ID of the concept to delete'),
  version: z.number().describe('The version of the concept to delete'),
});

type Params = z.infer<typeof DeleteConceptToolParams>;

async function tool(args: Params) {
  // Create a client without space-specific configuration for concept operations
  const clientConfig = getDefaultClientConfig();
  // Remove space from config since we're working at the organization level
  delete clientConfig.space;
  const contentfulClient = ctfl.createClient(clientConfig, { type: 'plain' });

  // Delete the concept
  await contentfulClient.concept.delete({
    organizationId: args.organizationId,
    conceptId: args.conceptId,
    version: args.version,
  });

  return createSuccessResponse('Concept deleted successfully', {
    conceptId: args.conceptId,
  });
}

export const deleteConceptTool = withErrorHandling(
  tool,
  'Error deleting concept',
);
