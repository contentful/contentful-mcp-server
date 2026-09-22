import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { summarizeData } from '../../utils/summarizer.js';
import type { ContentfulConfig } from '../../config/types.js';

export const ListAssetsToolParams = BaseToolSchema.extend({
  limit: z
    .number()
    .optional()
    .describe('Maximum number of assets to return (max 3)'),
  skip: z
    .number()
    .optional()
    .describe(
      'Skip this many assets for pagination. Use this only for random access to a bounded page (e.g. "show me page 3"). ' +
        "Don't use skip to iterate through an entire collection — performance degrades as the offset grows. " +
        'For exhaustive traversal (exports, analytics, migrations), set cursor: true and follow pageNext instead.',
    ),
  cursor: z
    .boolean()
    .optional()
    .describe(
      'Set to true to use cursor-based pagination instead of skip/limit. This is the correct way to fetch or ' +
        'process an entire collection of assets (exports, analytics, migrations), since it has no performance ' +
        'degradation as you page deeper. When set, pass the pageNext token from the previous response to fetch ' +
        'the next page (skip/total are not used in this mode).',
    ),
  pageNext: z
    .string()
    .optional()
    .describe(
      'Cursor token (from a previous cursor: true response) to fetch the next page of assets. Only used when cursor: true.',
    ),
  pagePrev: z
    .string()
    .optional()
    .describe(
      'Cursor token (from a previous cursor: true response) to fetch the previous page of assets. Only used when cursor: true.',
    ),
  select: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),
  include: z
    .number()
    .optional()
    .describe('Include this many levels of linked entries'),
  order: z.string().optional().describe('Order assets by this field'),
  links_to_entry: z
    .string()
    .optional()
    .describe('Find assets that link to the specified entry ID'),
  locale: z
    .string()
    .optional()
    .describe(
      'The locale to display asset fields in (e.g., "en-US", "de-DE"). Defaults to "en-US" if not specified.',
    ),
});

type Params = z.infer<typeof ListAssetsToolParams>;

function summarizeAssetItems(
  items: Array<{
    sys: {
      id: string;
      createdAt: string;
      updatedAt: string;
      publishedVersion?: number;
    };
    fields: Record<string, Record<string, unknown> | undefined>;
  }>,
  locale: string,
) {
  return items.map((asset) => {
    const file = asset.fields['file']?.[locale] as
      | {
          fileName?: string;
          contentType?: string;
          url?: string;
          details?: { size?: number };
        }
      | undefined;
    return {
      id: asset.sys.id,
      title: (asset.fields['title']?.[locale] as string) || 'Untitled',
      description: (asset.fields['description']?.[locale] as string) || null,
      fileName: file?.fileName || null,
      contentType: file?.contentType || null,
      url: file?.url || null,
      size: file?.details?.size || null,
      createdAt: asset.sys.createdAt,
      updatedAt: asset.sys.updatedAt,
      publishedVersion: asset.sys.publishedVersion,
      locale: locale,
    };
  });
}

export function listAssetsTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
    };

    const contentfulClient = createToolClient(config, args);
    const locale = args.locale || 'en-US';

    if (args.cursor) {
      // Cursor-based traversal: exhaustive/large-collection path. skip/total
      // don't apply here — pages.next/pages.prev drive continued iteration.
      const assets = await contentfulClient.asset.getManyWithCursor({
        ...params,
        query: {
          limit: Math.min(args.limit || 3, 3),
          ...(args.pageNext && { pageNext: args.pageNext }),
          ...(args.pagePrev && { pagePrev: args.pagePrev }),
          ...(args.select && { select: args.select }),
          ...(args.include && { include: args.include }),
          ...(args.order && { order: args.order }),
          ...(args.links_to_entry && { links_to_entry: args.links_to_entry }),
        } as unknown as Parameters<
          typeof contentfulClient.asset.getManyWithCursor
        >[0]['query'],
      });

      const summarizedAssets = summarizeAssetItems(assets.items, locale);

      const summarized = summarizeData(
        {
          ...assets,
          items: summarizedAssets,
        },
        {
          maxItems: 3,
          remainingMessage:
            'To retrieve the full collection, ask me to continue with cursor pagination (cursor: true) using the pageNext token, rather than repeatedly increasing skip.',
        },
      );

      return createSuccessResponse('Assets retrieved successfully', {
        assets: summarized,
        limit: assets.limit,
        pages: assets.pages,
      });
    }

    // Existing offset-based path (unchanged behavior).
    const assets = await contentfulClient.asset.getMany({
      ...params,
      query: {
        limit: Math.min(args.limit || 3, 3),
        skip: args.skip || 0,
        ...(args.select && { select: args.select }),
        ...(args.include && { include: args.include }),
        ...(args.order && { order: args.order }),
        ...(args.links_to_entry && { links_to_entry: args.links_to_entry }),
      },
    });

    const summarizedAssets = summarizeAssetItems(assets.items, locale);

    const summarized = summarizeData(
      {
        ...assets,
        items: summarizedAssets,
      },
      {
        maxItems: 3,
        remainingMessage:
          'To see more assets, please ask me to retrieve the next page. If you need the entire collection, ask me to use cursor pagination (cursor: true) instead of repeatedly increasing skip.',
      },
    );

    return createSuccessResponse('Assets retrieved successfully', {
      assets: summarized,
      total: assets.total,
      limit: assets.limit,
      skip: assets.skip,
    });
  }

  return withErrorHandling(tool, 'Error listing assets');
}
