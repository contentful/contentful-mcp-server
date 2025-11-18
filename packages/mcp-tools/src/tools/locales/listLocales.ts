import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { summarizeData } from '../../utils/summarizer.js';

export const ListLocaleToolParams = BaseToolSchema.extend({
  limit: z.number().optional().describe('Maximum number of locales to return'),
  skip: z.number().optional().describe('Skip this many locales for pagination'),
  select: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),
  include: z
    .number()
    .optional()
    .describe('Include this many levels of linked entries'),
  order: z.string().optional().describe('Order locales by this field'),
});

type Params = z.infer<typeof ListLocaleToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  const locales = await contentfulClient.locale.getMany({
    ...params,
    query: {
      limit: args.limit || 100,
      skip: args.skip || 0,
      ...(args.select && { select: args.select }),
      ...(args.include && { include: args.include }),
      ...(args.order && { order: args.order }),
    },
  });

  const summarizedLocales = locales.items.map((locale) => ({
    id: locale.sys.id,
    name: locale.name,
    code: locale.code,
    fallbackCode: locale.fallbackCode || null,
    contentDeliveryApi: locale.contentDeliveryApi,
    contentManagementApi: locale.contentManagementApi,
    default: locale.default,
    optional: locale.optional,
    createdAt: locale.sys.createdAt,
    updatedAt: locale.sys.updatedAt,
    version: locale.sys.version,
  }));

  const summarized = summarizeData(
    {
      ...locales,
      items: summarizedLocales,
    },
    {
      maxItems: 10,
      remainingMessage:
        'To see more locales, please ask me to retrieve the next page using the skip parameter.',
    },
  );

  return createSuccessResponse('Locales retrieved successfully', {
    locales: summarized,
    total: locales.total,
    limit: locales.limit,
    skip: locales.skip,
  });
}

export const listLocaleTool = withErrorHandling(tool, 'Error listing locales');
