import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { AssetMetadataSchema } from '../../types/taxonomySchema.js';

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
});

type Params = z.infer<typeof UploadAssetToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  // Prepare asset properties following Contentful's structure
  const assetProps = {
    fields: {
      title: { 'en-US': args.title },
      description: args.description ? { 'en-US': args.description } : undefined,
      file: { 'en-US': args.file },
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
