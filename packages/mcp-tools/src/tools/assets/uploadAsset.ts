import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import {
  BaseToolSchema,
  createToolClient,
  assertEnvironmentNotProtected,
} from '../../utils/tools.js';
import { AssetMetadataSchema } from '../../types/taxonomySchema.js';
import type { ContentfulConfig } from '../../config/types.js';

const FileSchema = z.object({
  fileName: z.string().describe('The name of the file'),
  contentType: z.string().describe('The MIME type of the file'),
  upload: z
    .string()
    .optional()
    .describe(
      'The file source. Accepts either a publicly accessible https:// URL, or a base64-encoded data URI (e.g. data:image/png;base64,...). Use the data URI format to upload local files — the MCP client should base64-encode the file before passing it here.',
    ),
});

export const UploadAssetToolParams = BaseToolSchema.extend({
  assetId: z
    .string()
    .optional()
    .describe(
      'Optional ID of an existing asset. When provided, no new asset is created: the file is attached to the given `locale` on this asset and processed for that locale only, so the asset gets its own processed file URL and can be published. Files, titles and descriptions of all other locales are left untouched. `locale` is required when `assetId` is provided. Use this to add or replace a per-locale file (e.g. a separate Arabic image) on a multi-locale asset — do not copy a file URL from another asset, as Contentful rejects publishing an asset whose file URL references a different asset.',
    ),
  title: z
    .string()
    .optional()
    .describe(
      'The title of the asset for `locale`. Required when creating a new asset. When `assetId` is provided it is optional and, if given, only sets the title for `locale`.',
    ),
  description: z
    .string()
    .optional()
    .describe(
      'The description of the asset for `locale`. When `assetId` is provided, only the description for `locale` is set.',
    ),
  file: FileSchema.describe('The file information for the asset'),
  metadata: AssetMetadataSchema,
  locale: z
    .string()
    .optional()
    .describe(
      'The locale code for the asset fields (e.g., "en-US", "de-DE", "ar"). Must be a locale that exists in the environment. Defaults to "en-US" when creating a new asset. Required when `assetId` is provided.',
    ),
});

type Params = z.infer<typeof UploadAssetToolParams>;

type FileField = {
  fileName: string;
  contentType: string;
  upload?: string;
  uploadFrom?: { sys: { type: 'Link'; linkType: 'Upload'; id: string } };
};

type MetadataLink = { sys: { id: string } };

/**
 * Merges two metadata link arrays (tags or concepts), de-duplicating by sys.id
 * so re-applying an existing tag does not produce duplicate links.
 */
function mergeLinks<T extends MetadataLink>(
  existing: T[] = [],
  incoming: T[] = [],
): T[] {
  const seen = new Set(existing.map((link) => link.sys.id));
  return [
    ...existing,
    ...incoming.filter((link) => {
      if (seen.has(link.sys.id)) return false;
      seen.add(link.sys.id);
      return true;
    }),
  ];
}

export function uploadAssetTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
    };

    // Validate mode-specific requirements before any API call
    if (args.assetId && !args.locale) {
      throw new Error(
        'locale is required when assetId is provided, so the file is attached to the intended locale of the existing asset.',
      );
    }
    if (!args.assetId && !args.title) {
      throw new Error('title is required when creating a new asset.');
    }

    const contentfulClient = createToolClient(config, args);

    // Prepare asset properties following Contentful's structure
    const locale = args.locale || 'en-US';

    async function buildFileField(): Promise<FileField> {
      const fileField: FileField = {
        fileName: args.file.fileName,
        contentType: args.file.contentType,
      };

      if (args.file.upload?.startsWith('data:')) {
        const commaIndex = args.file.upload.indexOf(',');
        if (commaIndex === -1) {
          throw new Error(
            'Invalid data URI format. Expected data:<mime>;base64,<data>',
          );
        }
        const base64 = args.file.upload.slice(commaIndex + 1);
        const decoded = Buffer.from(base64, 'base64');
        const buffer = decoded.buffer.slice(
          decoded.byteOffset,
          decoded.byteOffset + decoded.byteLength,
        );
        const upload = await contentfulClient.upload.create(params, {
          file: buffer,
        });
        fileField.uploadFrom = {
          sys: { type: 'Link', linkType: 'Upload', id: upload.sys.id },
        };
      } else if (args.file.upload) {
        fileField.upload = args.file.upload;
      }

      return fileField;
    }

    if (args.assetId) {
      // Attach a file to one locale of an existing asset and process only that locale.
      const assetParams = { ...params, assetId: args.assetId };

      // Fetch first so a missing/archived asset fails before creating an upload
      const existingAsset = await contentfulClient.asset.get(assetParams);
      const fileField = await buildFileField();

      const existingFields = existingAsset.fields;
      const fields = {
        ...existingFields,
        file: { ...(existingFields.file ?? {}), [locale]: fileField },
        ...(args.title !== undefined
          ? { title: { ...(existingFields.title ?? {}), [locale]: args.title } }
          : {}),
        ...(args.description !== undefined
          ? {
              description: {
                ...(existingFields.description ?? {}),
                [locale]: args.description,
              },
            }
          : {}),
      };

      const updatedAsset = await contentfulClient.asset.update(assetParams, {
        ...existingAsset,
        fields,
        metadata: {
          tags: mergeLinks(existingAsset.metadata?.tags, args.metadata?.tags),
          concepts: mergeLinks(
            existingAsset.metadata?.concepts,
            args.metadata?.concepts,
          ),
        },
      });

      // Process only the target locale. processForAllLocales would also try to
      // re-process locales whose files are already processed.
      const processedAsset = await contentfulClient.asset.processForLocale(
        params,
        updatedAsset,
        locale,
      );

      return createSuccessResponse(
        `Asset file uploaded and processed for locale "${locale}"`,
        { asset: processedAsset },
      );
    }

    const fileField = await buildFileField();

    const assetProps = {
      fields: {
        title: { [locale]: args.title as string },
        description: args.description
          ? { [locale]: args.description }
          : undefined,
        file: { [locale]: fileField },
      },
      metadata: args.metadata,
    };

    // Create the asset
    const asset = await contentfulClient.asset.create(params, assetProps);

    // Process the asset for all locales
    const processedAsset = await contentfulClient.asset.processForAllLocales(
      params,
      {
        sys: asset.sys,
        fields: asset.fields,
      },
      {},
    );

    return createSuccessResponse('Asset uploaded successfully', {
      asset: processedAsset,
    });
  }

  return withErrorHandling(tool, 'Error uploading asset');
}
