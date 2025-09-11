import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const GetTaxonomyConceptToolParams = BaseToolSchema.extend({
  organizationId: z.string().describe('The ID of the Contentful organization'),
  conceptId: z.string().describe('The ID of the taxonomy concept to retrieve'),
});

type Params = z.infer<typeof GetTaxonomyConceptToolParams>;

async function tool(args: Params) {
  const params = {
    conceptId: args.conceptId,
    organizationId: args.organizationId,
  };

  const contentfulClient = createToolClient(args);

  // Get the taxonomy concept
  const concept = await contentfulClient.concept.get(params);

  return createSuccessResponse('Taxonomy concept retrieved successfully', {
    concept,
  });
}

export const getTaxonomyConceptTool = withErrorHandling(
  tool,
  'Error retrieving taxonomy concept',
);
