import { z } from 'zod';
import { createClient, type CollectionProp } from 'contentful-management';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { createClientConfig } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';
import {
  configurationContentTypeId,
  type PreviewEnvironment,
} from './types.js';
import { previewEnvironmentsPath } from './client.js';

export const ListContentPreviewsToolParams = z.object({
  spaceId: z.string().describe('The ID of the Contentful space'),
  contentTypeId: z
    .string()
    .optional()
    .describe(
      'Only return previews that have an enabled configuration for this content type',
    ),
  limit: z
    .number()
    .optional()
    .describe('Maximum number of content previews to return (default 100)'),
  skip: z
    .number()
    .optional()
    .describe('Skip this many content previews for pagination'),
});

type Params = z.infer<typeof ListContentPreviewsToolParams>;

export function listContentPreviewsTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    // Content previews are configured per space, so the client is created
    // without a space/environment default and the path is passed explicitly.
    const contentfulClient = createClient(createClientConfig(config));

    const previews = await contentfulClient.raw.get<
      CollectionProp<PreviewEnvironment>
    >(previewEnvironmentsPath(args.spaceId), {
      params: {
        limit: args.limit ?? 100,
        ...(args.skip ? { skip: args.skip } : {}),
      },
    });

    const summarized = previews.items
      .map((preview) => ({
        id: preview.sys.id,
        name: preview.name,
        description: preview.description ?? null,
        configurations: preview.configurations
          .filter(
            (configuration) =>
              !args.contentTypeId ||
              (configuration.enabled &&
                configurationContentTypeId(configuration) ===
                  args.contentTypeId),
          )
          .map((configuration) => ({
            contentTypeId: configurationContentTypeId(configuration) ?? null,
            entityType: configuration.entityType ?? 'ContentType',
            urlTemplate: configuration.url,
            enabled: configuration.enabled,
          })),
      }))
      .filter(
        (preview) => !args.contentTypeId || preview.configurations.length > 0,
      );

    return createSuccessResponse('Content previews retrieved successfully', {
      contentPreviews: summarized,
      total: previews.total,
    });
  }

  return withErrorHandling(tool, 'Error listing content previews');
}
