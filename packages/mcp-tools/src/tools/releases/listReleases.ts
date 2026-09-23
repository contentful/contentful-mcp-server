import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { summarizeData } from '../../utils/summarizer.js';
import type { ContentfulConfig } from '../../config/types.js';

export const ListReleasesToolParams = BaseToolSchema.extend({
  limit: z
    .number()
    .optional()
    .describe('Maximum number of releases to return (max 10)'),
  pageNext: z
    .string()
    .optional()
    .describe('Cursor token to fetch the next page of results'),
  pagePrev: z
    .string()
    .optional()
    .describe('Cursor token to fetch the previous page of results'),
  statusIn: z
    .string()
    .optional()
    .describe('Comma-separated list of statuses to include (active, archived)'),
  statusNin: z
    .string()
    .optional()
    .describe('Comma-separated list of statuses to exclude (active, archived)'),
  titleMatch: z
    .string()
    .optional()
    .describe('Full text phrase/term match on release title'),
  entitiesLinkType: z
    .string()
    .optional()
    .describe('Filter releases by the linked entity type (Entry or Asset)'),
  entitiesSysIdIn: z
    .string()
    .optional()
    .describe(
      'Comma-separated list of entity IDs the release must contain. Requires entitiesLinkType.',
    ),
});

type Params = z.infer<typeof ListReleasesToolParams>;

export function listReleasesTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createToolClient(config, args);

    const releases = await contentfulClient.release.query({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      query: {
        limit: Math.min(args.limit || 10, 10),
        ...(args.pageNext && { pageNext: args.pageNext }),
        ...(args.pagePrev && { pagePrev: args.pagePrev }),
        ...(args.statusIn && { 'sys.status[in]': args.statusIn }),
        ...(args.statusNin && { 'sys.status[nin]': args.statusNin }),
        ...(args.titleMatch && { 'title[match]': args.titleMatch }),
        ...(args.entitiesLinkType && {
          'entities.sys.linkType': args.entitiesLinkType,
        }),
        ...(args.entitiesSysIdIn && {
          'entities.sys.id[in]': args.entitiesSysIdIn,
        }),
      } as unknown as Parameters<
        typeof contentfulClient.release.query
      >[0]['query'],
    });

    const summarized = summarizeData(releases, {
      maxItems: 10,
      remainingMessage:
        'To see more releases, ask me to retrieve the next page using the pageNext cursor.',
    });

    return createSuccessResponse('Releases retrieved successfully', {
      releases: summarized,
      pages: releases.pages,
    });
  }

  return withErrorHandling(tool, 'Error listing releases');
}
