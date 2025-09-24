import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import ctfl from 'contentful-management';
import { getDefaultClientConfig } from '../../../config/contentful.js';

export const DeleteConceptSchemeToolParams = z.object({
  organizationId: z.string().describe('The ID of the Contentful organization'),
  conceptSchemeId: z
    .string()
    .describe('The ID of the concept scheme to delete'),
  version: z.number().describe('The version of the concept scheme to delete'),
});

type Params = z.infer<typeof DeleteConceptSchemeToolParams>;

async function tool(args: Params) {
  // Create a client without space-specific configuration for concept scheme operations
  const clientConfig = getDefaultClientConfig();
  // Remove space from config since we're working at the organization level
  delete clientConfig.space;
  const contentfulClient = ctfl.createClient(clientConfig, { type: 'plain' });

  // Delete the concept scheme
  await contentfulClient.conceptScheme.delete({
    organizationId: args.organizationId,
    conceptSchemeId: args.conceptSchemeId,
    version: args.version,
  });

  return createSuccessResponse('Concept scheme deleted successfully', {
    conceptSchemeId: args.conceptSchemeId,
  });
}

export const deleteConceptSchemeTool = withErrorHandling(
  tool,
  'Error deleting concept scheme',
);
