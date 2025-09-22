import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { createToolClient } from '../../../utils/tools.js';
import { summarizeData } from '../../../utils/summarizer.js';

export const ListConceptSchemesToolParams = z.object({
  organizationId: z.string().describe('The ID of the Contentful organization'),
  limit: z
    .number()
    .optional()
    .describe('Maximum number of concept schemes to return'),
  skip: z
    .number()
    .optional()
    .describe('Skip this many concept schemes for pagination'),
  select: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),
  include: z
    .number()
    .optional()
    .describe('Include this many levels of linked entries'),
  order: z.string().optional().describe('Order concept schemes by this field'),
});

type Params = z.infer<typeof ListConceptSchemesToolParams>;

async function tool(args: Params) {
  const contentfulClient = createToolClient({
    spaceId: 'dummy', // Not needed for concept scheme operations but required by BaseToolSchema
    environmentId: 'dummy', // Not needed for concept scheme operations but required by BaseToolSchema
  });

  const conceptSchemes = await contentfulClient.conceptScheme.getMany({
    organizationId: args.organizationId,
    query: {
      limit: args.limit || 10,
      skip: args.skip || 0,
      ...(args.select && { select: args.select }),
      ...(args.include && { include: args.include }),
      ...(args.order && { order: args.order }),
    },
  });

  const summarizedConceptSchemes = conceptSchemes.items.map(
    (conceptScheme) => ({
      id: conceptScheme.sys.id,
      prefLabel: conceptScheme.prefLabel || {},
      uri: conceptScheme.uri || null,
      definition: conceptScheme.definition || null,
      topConcepts: conceptScheme.topConcepts || [],
      createdAt: conceptScheme.sys.createdAt,
      updatedAt: conceptScheme.sys.updatedAt,
      version: conceptScheme.sys.version,
    }),
  );

  const summarized = summarizeData(
    {
      ...conceptSchemes,
      items: summarizedConceptSchemes,
    },
    {
      maxItems: 10,
      remainingMessage:
        'To see more concept schemes, please ask me to retrieve the next page using the skip parameter.',
    },
  );

  return createSuccessResponse('Concept schemes retrieved successfully', {
    conceptSchemes: summarized,
    total: (conceptSchemes as any).total || conceptSchemes.items.length,
    limit: (conceptSchemes as any).limit || args.limit || 10,
    skip: (conceptSchemes as any).skip || args.skip || 0,
  });
}

export const listConceptSchemesTool = withErrorHandling(
  tool,
  'Error listing concept schemes',
);
