import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const SemanticSearchToolParams = BaseToolSchema.extend({
  query: z
    .string()
    .describe(
      'Natural-language description of what you are looking for. Phrases that resemble the content of the entries you want match best — avoid questions or JSON.',
    ),
  contentTypeIds: z
    .array(z.string())
    .min(1)
    .optional()
    .describe('Restrict the search to entries of these content type IDs'),
});

type Params = z.infer<typeof SemanticSearchToolParams>;

export function semanticSearchTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createToolClient(config, args);

    const filter =
      args.contentTypeIds && args.contentTypeIds.length > 0
        ? { entityType: 'Entry' as const, contentTypeIds: args.contentTypeIds }
        : undefined;

    const results = await contentfulClient.semanticSearch.get(
      {
        spaceId: args.spaceId,
        environmentId: args.environmentId,
      },
      {
        query: args.query,
        ...(filter ? { filter } : {}),
      },
    );

    const entries = results.items.map((item) => ({
      id: item.sys.entity.sys.id,
    }));

    return createSuccessResponse(
      'Semantic search results retrieved successfully',
      {
        entries,
        ...(results.sys.correlationId !== undefined
          ? { correlationId: results.sys.correlationId }
          : {}),
      },
    );
  }

  return withErrorHandling(tool, 'Error performing semantic search');
}
