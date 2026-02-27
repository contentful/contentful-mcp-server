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
  skip: z.number().optional().describe('Skip this many assets for pagination'),
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

export function listAssetsTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
    };

    const contentfulClient = await createToolClient(config, args);

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

  const locale = args.locale || 'en-US';

  const summarizedAssets = assets.items.map((asset) => {
    return {
      id: asset.sys.id,
      title: asset.fields.title?.[locale] || 'Untitled',
      description: asset.fields.description?.[locale] || null,
      fileName: asset.fields.file?.[locale]?.fileName || null,
      contentType: asset.fields.file?.[locale]?.contentType || null,
      url: asset.fields.file?.[locale]?.url || null,
      size: asset.fields.file?.[locale]?.details?.['size'] || null,
      createdAt: asset.sys.createdAt,
      updatedAt: asset.sys.updatedAt,
      publishedVersion: asset.sys.publishedVersion,
      locale: locale,
    };
  });

  const summarized = summarizeData(
    {
      ...assets,
      items: summarizedAssets,
    },
    {
      maxItems: 3,
      remainingMessage:
        'To see more assets, please ask me to retrieve the next page using the skip parameter.',
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
