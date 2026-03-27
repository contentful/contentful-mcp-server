import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import ctfl from 'contentful-management';
import { createClientConfig } from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';
import { summarizeData } from '../../../utils/summarizer.js';

export const ListConceptSchemesToolParams = z.object({
  organizationId: z
    .string()
    .describe('The ID of the Contentful organization'),
  limit: z
    .number()
    .optional()
    .describe('Maximum number of concept schemes to return'),
  pageNext: z
    .string()
    .optional()
    .describe('Cursor token for the next page of concept schemes'),
  pagePrev: z
    .string()
    .optional()
    .describe('Cursor token for the previous page of concept schemes'),
  pageUrl: z
    .never()
    .describe(
      'Only Cursor-based pagination is supported for concept schemes. Please use pageNext or pagePrev instead.',
    ),
  select: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),
  include: z
    .number()
    .optional()
    .describe('Include this many levels of linked entries'),
  order: z.string().optional().describe('Order concept schemes by this field'),
}).describe('Parameters for listing concept schemes, cursor-based pagination is strictly enforced');

type Params = z.infer<typeof ListConceptSchemesToolParams>;

export function listConceptSchemesTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    // Create a client without space-specific configuration for concept scheme operations
    const clientConfig = createClientConfig(config);
    // Remove space from config since we're working at the organization level
    delete clientConfig.space;
    const contentfulClient = ctfl.createClient(clientConfig, { type: 'plain' });

    const query = {
      limit: args.limit || 10,
      ...(args.pageNext && { pageNext: args.pageNext }),
      ...(args.pagePrev && { pagePrev: args.pagePrev }),
      ...(args.select && { select: args.select }),
      ...(args.include && { include: args.include }),
      ...(args.order && { order: args.order }),
    };

    const conceptSchemes = await contentfulClient.conceptScheme.getMany({
      organizationId: args.organizationId,
      query,
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
          'To see more concept schemes, please ask me to retrieve the next page using cursor based pagination with pageNext and pagePrev.',
      },
    );

    return createSuccessResponse('Concept schemes retrieved successfully', {
      conceptSchemes: summarized,
      total:
        (conceptSchemes as { total?: number }).total ||
        conceptSchemes.items.length,
      limit: (conceptSchemes as { limit?: number }).limit || args.limit || 10,
    });
  }

  return withErrorHandling(tool, 'Error listing concept schemes');
}
