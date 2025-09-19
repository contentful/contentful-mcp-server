import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { createToolClient } from '../../../utils/tools.js';

export const DeleteConceptSchemeToolParams = z.object({
  organizationId: z.string().describe('The ID of the Contentful organization'),
  conceptSchemeId: z
    .string()
    .describe('The ID of the concept scheme to delete'),
  version: z.number().describe('The version of the concept scheme to delete'),
});

type Params = z.infer<typeof DeleteConceptSchemeToolParams>;

async function tool(args: Params) {
  const contentfulClient = createToolClient({
    spaceId: 'dummy', // Not needed for concept scheme deletion but required by BaseToolSchema
    environmentId: 'dummy', // Not needed for concept scheme deletion but required by BaseToolSchema
  });

  // First, get the concept scheme to store info for return
  const conceptScheme = await contentfulClient.conceptScheme.get({
    organizationId: args.organizationId,
    conceptSchemeId: args.conceptSchemeId,
  });

  // Delete the concept scheme
  await contentfulClient.conceptScheme.delete({
    organizationId: args.organizationId,
    conceptSchemeId: args.conceptSchemeId,
    version: args.version,
  });

  return createSuccessResponse('Concept scheme deleted successfully', {
    conceptScheme,
  });
}

export const deleteConceptSchemeTool = withErrorHandling(
  tool,
  'Error deleting concept scheme',
);
