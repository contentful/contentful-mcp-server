import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { createToolClient } from '../../../utils/tools.js';

export const GetConceptSchemeToolParams = z.object({
  organizationId: z.string().describe('The ID of the Contentful organization'),
  conceptSchemeId: z
    .string()
    .describe('The ID of the concept scheme to retrieve'),
});

type Params = z.infer<typeof GetConceptSchemeToolParams>;

async function tool(args: Params) {
  const contentfulClient = createToolClient({
    spaceId: 'dummy', // Not needed for concept scheme operations but required by BaseToolSchema
    environmentId: 'dummy', // Not needed for concept scheme operations but required by BaseToolSchema
  });

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
