import { z } from 'zod';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
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
  upload: z.string().optional().describe('The upload URL or file data'),
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

    const fileField: {
      fileName: string;
      contentType: string;
      upload?: string;
      uploadFrom?: { sys: { type: 'Link'; linkType: 'Upload'; id: string } };
    } = {
      fileName: args.file.fileName,
      contentType: args.file.contentType,
    };

    if (args.file.upload) {
      if (
        args.file.upload.startsWith('http://') ||
        args.file.upload.startsWith('https://')
      ) {
        fileField.upload = args.file.upload;
      } else {
        let filePath = args.file.upload;
        if (filePath.startsWith('file://')) {
          filePath = fileURLToPath(filePath);
        }
        
        // Upload the file content first
        const fileContent = await fs.readFile(filePath);
        const upload = await contentfulClient.upload.create(params, {
          file: fileContent,
        });

        fileField.uploadFrom = {
          sys: { type: 'Link', linkType: 'Upload', id: upload.sys.id },
        };
      }
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
