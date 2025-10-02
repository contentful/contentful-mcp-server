import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const UpdateAssetToolParams = BaseToolSchema.extend({
  assetId: z.string().describe('The ID of the asset to update'),
  fields: z
    .record(z.any())
    .describe(
      'The field values to update. Keys should be field IDs and values should be the field content. Will be merged with existing fields.',
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

type Params = z.infer<typeof UpdateAssetToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
    assetId: args.assetId,
  };

  const contentfulClient = createToolClient(args);

  // Get existing asset, merge fields, and update
  const existingAsset = await contentfulClient.asset.get(params);
  const updatedAsset = await contentfulClient.asset.update(params, {
    ...existingAsset,
    fields: { ...existingAsset.fields, ...args.fields },
    metadata: {
      tags: [
        ...(existingAsset.metadata?.tags || []),
        ...(args.metadata?.tags || []),
      ],
    },
  });

  return createSuccessResponse('Asset updated successfully', { updatedAsset });
}

export const updateAssetTool = withErrorHandling(tool, 'Error updating asset');
