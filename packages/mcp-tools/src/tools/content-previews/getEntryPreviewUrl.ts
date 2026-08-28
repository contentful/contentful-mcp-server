import { z } from 'zod';
import type { CollectionProp, EntryProps } from 'contentful-management';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';
import { findEnabledConfiguration, type PreviewEnvironment } from './types.js';
import { previewEnvironmentsPath } from './client.js';
import { resolvePreviewUrl, type PreviewEntryContext } from './previewUrl.js';

export const GetEntryPreviewUrlToolParams = BaseToolSchema.extend({
  entryId: z
    .string()
    .describe('The ID of the entry to build a preview URL for'),
  previewId: z
    .string()
    .optional()
    .describe(
      'ID of the content preview to use. Defaults to the first preview with an enabled configuration for the entry content type. Use list_content_previews to see the options.',
    ),
  locale: z
    .string()
    .optional()
    .describe(
      'Locale code substituted into the {locale} token. Defaults to the space default locale.',
    ),
});

type Params = z.infer<typeof GetEntryPreviewUrlToolParams>;

function toEntryContext(entry: EntryProps): PreviewEntryContext {
  return {
    sys: entry.sys as unknown as PreviewEntryContext['sys'],
    fields: entry.fields as Record<string, unknown>,
  };
}

export function getEntryPreviewUrlTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const scope = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
    };

    const contentfulClient = createToolClient(config, args);

    const entry = await contentfulClient.entry.get({
      ...scope,
      entryId: args.entryId,
    });

    const contentTypeId = entry.sys.contentType?.sys.id;
    if (!contentTypeId) {
      throw new Error(
        `Entry "${args.entryId}" has no content type, so no preview configuration can be matched.`,
      );
    }

    const previews = await contentfulClient.raw.get<
      CollectionProp<PreviewEnvironment>
    >(previewEnvironmentsPath(args.spaceId), { params: { limit: 100 } });

    // Pair each preview with the configuration that matched, so the selected
    // preview and its URL template stay together.
    const candidates = previews.items.flatMap((preview) => {
      const configuration = findEnabledConfiguration(preview, contentTypeId);
      return configuration ? [{ preview, configuration }] : [];
    });

    if (candidates.length === 0) {
      throw new Error(
        `No content preview with an enabled configuration for content type "${contentTypeId}" exists in space "${args.spaceId}". Add one under Settings → Content Preview, or call list_content_previews to see what is configured.`,
      );
    }

    const selected = args.previewId
      ? candidates.find(
          (candidate) => candidate.preview.sys.id === args.previewId,
        )
      : candidates[0];

    if (!selected) {
      throw new Error(
        `Content preview "${args.previewId}" has no enabled configuration for content type "${contentTypeId}". Available previews for this content type: ${candidates
          .map(({ preview }) => `${preview.name} (${preview.sys.id})`)
          .join(', ')}.`,
      );
    }

    const { preview, configuration } = selected;

    const locales = await contentfulClient.locale.getMany({
      ...scope,
      query: { limit: 100 },
    });
    const defaultLocaleCode =
      locales.items.find((locale) => locale.default)?.code ??
      locales.items[0]?.code;

    if (!defaultLocaleCode) {
      throw new Error(
        `No locales found for ${args.spaceId}/${args.environmentId}, so localized preview tokens cannot be resolved.`,
      );
    }

    const { url, unresolvedTokens } = await resolvePreviewUrl({
      template: configuration.url,
      entry: toEntryContext(entry),
      environmentId: args.environmentId,
      defaultLocaleCode,
      currentLocaleCode: args.locale,
      getEntry: async (entryId) => {
        try {
          return toEntryContext(
            await contentfulClient.entry.get({ ...scope, entryId }),
          );
        } catch {
          return undefined;
        }
      },
      getIncomingLink: async (entryId) => {
        try {
          const linking = await contentfulClient.entry.getMany({
            ...scope,
            query: { links_to_entry: entryId, limit: 1 },
          });
          const first = linking.items[0];
          return first ? toEntryContext(first) : undefined;
        } catch {
          return undefined;
        }
      },
    });

    return createSuccessResponse('Entry preview URL resolved successfully', {
      previewUrl: url,
      previewId: preview.sys.id,
      previewName: preview.name,
      contentTypeId,
      urlTemplate: configuration.url,
      locale: args.locale ?? defaultLocaleCode,
      ...(unresolvedTokens.length > 0
        ? {
            unresolvedTokens,
            warning:
              'The URL still contains the tokens listed above because no value could be resolved for them. Verify the link before sharing it.',
          }
        : {}),
    });
  }

  return withErrorHandling(tool, 'Error resolving entry preview URL');
}
