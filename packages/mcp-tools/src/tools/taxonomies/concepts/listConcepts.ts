import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import ctfl from 'contentful-management';
import { createClientConfig } from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';
import { summarizeData } from '../../../utils/summarizer.js';

export const ListConceptsToolParams = z.object({
  organizationId: z.string().describe('The ID of the Contentful organization'),
  conceptId: z
    .string()
    .optional()
    .describe('The ID of the concept (required for descendants/ancestors)'),
  limit: z.number().optional().describe('Maximum number of concepts to return'),
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
  getDescendants: z
    .boolean()
    .optional()
    .describe('Get descendants of the specified concept (requires conceptId)'),
  getAncestors: z
    .boolean()
    .optional()
    .describe('Get ancestors of the specified concept (requires conceptId)'),
  getTotalOnly: z
    .boolean()
    .optional()
    .describe('Get only the total number of concepts without full data'),
});

type Params = z.infer<typeof ListConceptsToolParams>;

export function listConceptsTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    // Create a client without space-specific configuration for concept operations
    const clientConfig = createClientConfig(config);
    // Remove space from config since we're working at the organization level
    delete clientConfig.space;
    const contentfulClient = ctfl.createClient(clientConfig, { type: 'plain' });

  // Validate required parameters for specific operations
  if ((args.getDescendants || args.getAncestors) && !args.conceptId) {
    throw new Error(
      'conceptId is required when getting descendants or ancestors',
    );
  }

  // Handle getTotalOnly - return just the total count
  if (args.getTotalOnly) {
    const total = await contentfulClient.concept.getTotal({
      organizationId: args.organizationId,
    });
    return createSuccessResponse('Total concepts retrieved successfully', {
      total,
    });
  }

  // Handle getDescendants
  if (args.getDescendants) {
    const descendants = await contentfulClient.concept.getDescendants({
      organizationId: args.organizationId,
      conceptId: args.conceptId!,
      ...(args.limit && { limit: args.limit }),
      ...(args.skip && { skip: args.skip }),
      ...(args.select && { select: args.select }),
      ...(args.include && { include: args.include }),
      ...(args.order && { order: args.order }),
    });

    const summarizedDescendants = descendants.items.map((concept) => ({
      sys: concept.sys,
      prefLabel: concept.prefLabel,
      uri: concept.uri,
      broader: concept.broader,
      related: concept.related,
    }));

    const responseData = summarizeData({
      ...descendants,
      items: summarizedDescendants,
    });

    return createSuccessResponse(
      'Concept descendants retrieved successfully',
      responseData as Record<string, unknown>,
    );
  }

  // Handle getAncestors
  if (args.getAncestors) {
    const ancestors = await contentfulClient.concept.getAncestors({
      organizationId: args.organizationId,
      conceptId: args.conceptId!,
      ...(args.limit && { limit: args.limit }),
      ...(args.skip && { skip: args.skip }),
      ...(args.select && { select: args.select }),
      ...(args.include && { include: args.include }),
      ...(args.order && { order: args.order }),
    });

    const summarizedAncestors = ancestors.items.map((concept) => ({
      sys: concept.sys,
      prefLabel: concept.prefLabel,
      uri: concept.uri,
      broader: concept.broader,
      related: concept.related,
    }));

    const responseData = summarizeData({
      ...ancestors,
      items: summarizedAncestors,
    });

    return createSuccessResponse(
      'Concept ancestors retrieved successfully',
      responseData as Record<string, unknown>,
    );
  }

  // Default behavior - get all concepts
  const concepts = await contentfulClient.concept.getMany({
    organizationId: args.organizationId,
    query: {
      limit: args.limit || 10,
      skip: args.skip || 0,
      ...(args.select && { select: args.select }),
      ...(args.include && { include: args.include }),
      ...(args.order && { order: args.order }),
    },
  });

  const summarizedConcepts = concepts.items.map((concept) => ({
    sys: concept.sys,
    prefLabel: concept.prefLabel,
    uri: concept.uri,
    broader: concept.broader,
    related: concept.related,
  }));

  const responseData = summarizeData({
    ...concepts,
    items: summarizedConcepts,
  });

    return createSuccessResponse(
      'Concepts retrieved successfully',
      responseData as Record<string, unknown>,
    );
  }

  return withErrorHandling(tool, 'Error retrieving concepts');
}
