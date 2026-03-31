import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import ctfl from 'contentful-management';
import { cloneDeep } from 'lodash-es';
import { createClientConfig } from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';
import { summarizeData } from '../../../utils/summarizer.js';

export const ListConceptSchemesToolParams = z
  .object({
    organizationId: z.string(),
    query: z
      .union([
        z
          .object({
            query: z.string().optional(),
            pageNext: z
              .string()
              .optional()
              .describe('Cursor token for the next page of concept schemes'),
            pagePrev: z
              .string()
              .optional()
              .describe(
                'Cursor token for the previous page of concept schemes',
              ),
            limit: z
              .number()
              .optional()
              .describe('Maximum number of concept schemes to return'),
            order: z
              .string()
              .optional()
              .describe('Order concept schemes by this field'),
            skip: z.never().optional(),
          })
          .passthrough(), // handles [key: string]: any from BasicQueryOptions
        z.object({
          pageUrl: z.string().optional(),
        }),
      ])
      .optional()
      .describe(
        'Query parameters for listing concept schemes, supports either pageUrl for cursor-based pagination.  Offset "skip" pagination is not supported.',
      ),
  })
  .describe(
    'Parameters for listing concept schemes, cursor-based pagination is strictly enforced',
  );

export type Params = z.infer<typeof ListConceptSchemesToolParams>;

export function listConceptSchemesTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    // Create a client without space-specific configuration for concept scheme operations
    const clientConfig = createClientConfig(config);
    // Remove space from config since we're working at the organization level
    delete clientConfig.space;
    const contentfulClient = ctfl.createClient(clientConfig, { type: 'plain' });

    // Handle the union type for query - it can be either { pageUrl?: string } or a more complex query object
    const query: Record<string, any> = {};

    if (args.query) {
      if ('pageUrl' in args.query && args.query.pageUrl) {
        // Simple pageUrl-based pagination
        query['pageUrl'] = args.query.pageUrl;
      } else {
        // Complex query with pagination options - use bracket notation
        const complexQuery = cloneDeep(args.query) as any;
        if (complexQuery['query']) query['query'] = complexQuery['query'];
        if (complexQuery['pageNext'])
          query['pageNext'] = complexQuery['pageNext'];
        if (complexQuery['pagePrev'])
          query['pagePrev'] = complexQuery['pagePrev'];
        if (complexQuery['select']) query['select'] = complexQuery['select'];
        if (complexQuery['include']) query['include'] = complexQuery['include'];
        if (complexQuery['order']) query['order'] = complexQuery['order'];
        if (complexQuery['limit']) query['limit'] = complexQuery['limit'];
      }
    }

    // Set default limit if not provided
    if (!query['limit'] && !query['pageUrl']) {
      query['limit'] = 10;
    }

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

    // Extract limit from query if exists
    const queryLimit =
      args.query && 'limit' in args.query
        ? (args.query as any).limit
        : undefined;

    return createSuccessResponse('Concept schemes retrieved successfully', {
      conceptSchemes: summarized,
      total:
        (conceptSchemes as { total?: number }).total ||
        conceptSchemes.items.length,
      limit: (conceptSchemes as { limit?: number }).limit || queryLimit || 10,
    });
  }

  return withErrorHandling(tool, 'Error listing concept schemes');
}
