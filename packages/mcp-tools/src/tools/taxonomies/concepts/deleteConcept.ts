import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import * as ctfl from 'contentful-management';
import { createClientConfig } from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const DeleteConceptToolParams = z.object({
  organizationId: z.string().describe('The ID of the Contentful organization'),
  conceptId: z.string().describe('The ID of the concept to delete'),
  version: z.number().describe('The version of the concept to delete'),
});

type Params = z.infer<typeof DeleteConceptToolParams>;

export function deleteConceptTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    // Create a client without space-specific configuration for concept operations
    const clientConfig = createClientConfig(config);
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

  return withErrorHandling(tool, 'Error deleting concept');
}
