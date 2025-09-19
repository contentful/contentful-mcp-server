import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { createToolClient } from '../../../utils/tools.js';

export const DeleteConceptToolParams = z.object({
  organizationId: z.string().describe('The ID of the Contentful organization'),
  conceptId: z.string().describe('The ID of the concept to delete'),
  version: z.number().describe('The version of the concept to delete'),
});

type Params = z.infer<typeof DeleteConceptToolParams>;

async function tool(args: Params) {
  const contentfulClient = createToolClient({
    spaceId: 'dummy', // Not needed for concept deletion but required by BaseToolSchema
    environmentId: 'dummy', // Not needed for concept deletion but required by BaseToolSchema
  });

  // First, get the concept to store info for return
  const concept = await contentfulClient.concept.get({
    organizationId: args.organizationId,
    conceptId: args.conceptId,
  });

  // Delete the concept
  await contentfulClient.concept.delete({
    organizationId: args.organizationId,
    conceptId: args.conceptId,
    version: args.version,
  });

  return createSuccessResponse('Concept deleted successfully', { concept });
}

export const deleteConceptTool = withErrorHandling(
  tool,
  'Error deleting concept',
);
