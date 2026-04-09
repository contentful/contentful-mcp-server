import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
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
  title: z.string().describe('The title of the asset'),
  description: z.string().optional().describe('The description of the asset'),
  file: FileSchema.describe('The file information for the asset'),
  metadata: AssetMetadataSchema,
  locale: z
    .string()
    .optional()
    .describe(
      'The locale for the asset fields (e.g., "en-US", "de-DE"). Defaults to "en-US" if not specified.',
    ),
});

type Params = z.infer<typeof UploadAssetToolParams>;

export function uploadAssetTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
    };

    const contentfulClient = createToolClient(config, args);

    // Prepare asset properties following Contentful's structure
    const locale = args.locale || 'en-US';

    type FileField = {
      fileName: string;
      contentType: string;
      upload?: string;
      uploadFrom?: { sys: { type: 'Link'; linkType: 'Upload'; id: string } };
    };

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
      const buffer = Buffer.from(base64, 'base64').buffer;
      const upload = await contentfulClient.upload.create(params, {
        file: buffer,
      });
      fileField.uploadFrom = {
        sys: { type: 'Link', linkType: 'Upload', id: upload.sys.id },
      };
    } else if (args.file.upload) {
      fileField.upload = args.file.upload;
    }

    const assetProps = {
      fields: {
        title: { [locale]: args.title },
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
