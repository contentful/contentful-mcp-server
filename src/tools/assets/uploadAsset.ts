import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

const FileSchema = z.object({
  fileName: z.string().describe('The name of the file'),
  contentType: z.string().describe('The MIME type of the file'),
  upload: z.string().optional().describe('The upload URL or file data'),
});

export const UploadAssetToolParams = BaseToolSchema.extend({
  title: z.string().describe('The title of the asset'),
  description: z.string().optional().describe('The description of the asset'),
  file: FileSchema.describe('The file information for the asset'),
  locale: z
    .string()
    .optional()
    .describe(
      'The locale for the asset fields (e.g., "en-US", "de-DE"). Defaults to "en-US" if not specified.',
    ),
  metadata: z
    .object({
      tags: z.array(
        z.object({
          sys: z.object({
            type: z.literal('Link'),
            linkType: z.literal('Tag'),
            id: z.string(),
          }),
        }),
      ),
    })
    .optional(),
});

type Params = z.infer<typeof UploadAssetToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  // Prepare asset properties following Contentful's structure
  const locale = args.locale || 'en-US';
  const assetProps = {
    fields: {
      title: { [locale]: args.title },
      description: args.description
        ? { [locale]: args.description }
        : undefined,
      file: { [locale]: args.file },
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

export const uploadAssetTool = withErrorHandling(tool, 'Error uploading asset');
