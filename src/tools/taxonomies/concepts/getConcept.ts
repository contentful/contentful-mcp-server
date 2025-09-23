import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { createToolClient } from '../../../utils/tools.js';

export const GetConceptToolParams = z.object({
  organizationId: z.string().describe('The ID of the Contentful organization'),
  conceptId: z.string().describe('The ID of the concept to retrieve'),
});

type Params = z.infer<typeof GetConceptToolParams>;

async function tool(args: Params) {
  const contentfulClient = createToolClient({
    spaceId: 'dummy', // Not needed for concept operations but required by BaseToolSchema
    environmentId: 'dummy', // Not needed for concept operations but required by BaseToolSchema
  });

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
