import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { summarizeData } from '../../utils/summarizer.js';

export const ListConceptsToolParams = BaseToolSchema.extend({
  organizationId: z.string().describe('The ID of the Contentful organization'),
  conceptId: z
    .string()
    .optional()
    .describe(
      'The ID of the taxonomy concept (required for descendants/ancestors operations)',
    ),
  limit: z
    .number()
    .optional()
    .describe('Maximum number of concepts to return (max 10)'),
  skip: z
    .number()
    .optional()
    .describe('Skip this many concepts for pagination'),
  select: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),
  include: z
    .number()
    .optional()
    .describe('Include this many levels of linked entries'),
  order: z.string().optional().describe('Order concepts by this field'),
  // Operation type flags - only one should be true at a time
  getMany: z
    .boolean()
    .default(true)
    .describe('Get many concepts (default operation)'),
  getTotal: z.boolean().default(false).describe('Get total count of concepts'),
  getDescendants: z
    .boolean()
    .default(false)
    .describe('Get descendants of a specific concept (requires conceptId)'),
  getAncestors: z
    .boolean()
    .default(false)
    .describe('Get ancestors of a specific concept (requires conceptId)'),
});

type Params = z.infer<typeof ListConceptsToolParams>;

async function tool(args: Params) {
  const contentfulClient = createToolClient(args);

  let result;
  let message = 'Concepts retrieved successfully';

  if (args.getTotal) {
    // Get total count of concepts
    result = await contentfulClient.concept.getTotal({
      organizationId: args.organizationId,
    });
    message = 'Concept total count retrieved successfully';
  } else if (args.getDescendants) {
    // Get descendants of a specific concept
    if (!args.conceptId) {
      throw new Error('conceptId is required when getDescendants is true');
    }
    result = await contentfulClient.concept.getDescendants({
      organizationId: args.organizationId,
      conceptId: args.conceptId,
    });
    message = 'Concept descendants retrieved successfully';
  } else if (args.getAncestors) {
    // Get ancestors of a specific concept
    if (!args.conceptId) {
      throw new Error('conceptId is required when getAncestors is true');
    }
    result = await contentfulClient.concept.getAncestors({
      organizationId: args.organizationId,
      conceptId: args.conceptId,
    });
    message = 'Concept ancestors retrieved successfully';
  } else {
    // Default: Get many concepts with pagination and filtering
    result = await contentfulClient.concept.getMany({
      organizationId: args.organizationId,
      query: {
        limit: Math.min(args.limit || 10, 10),
        skip: args.skip || 0,
        ...(args.select && { select: args.select }),
        ...(args.include && { include: args.include }),
        ...(args.order && { order: args.order }),
      },
    });
    message = 'Concepts retrieved successfully';
  }

  // For getMany operations, apply summarization
  if (
    args.getMany ||
    (!args.getTotal && !args.getDescendants && !args.getAncestors)
  ) {
    const summarized = summarizeData(result, {
      maxItems: 10,
      remainingMessage:
        'To see more concepts, please ask me to retrieve the next page using the skip parameter.',
    });

    return createSuccessResponse(message, {
      concepts: summarized,
      // Only include pagination info if result has these properties (getMany operation)
      ...(result && 'total' in result && { total: result.total }),
      ...(result && 'limit' in result && { limit: result.limit }),
      ...(result && 'skip' in result && { skip: result.skip }),
    });
  }

  // For other operations, return the result directly
  return createSuccessResponse(message, { concepts: result });
}

export const listConceptsTool = withErrorHandling(
  tool,
  'Error listing concepts',
);
