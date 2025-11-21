import { uploadAssetTool, UploadAssetToolParams } from './uploadAsset.js';
import { listAssetsTool, ListAssetsToolParams } from './listAssets.js';
import { getAssetTool, GetAssetToolParams } from './getAsset.js';
import { updateAssetTool, UpdateAssetToolParams } from './updateAsset.js';
import { deleteAssetTool, DeleteAssetToolParams } from './deleteAsset.js';
import { publishAssetTool, PublishAssetToolParams } from './publishAsset.js';
import {
  unpublishAssetTool,
  UnpublishAssetToolParams,
} from './unpublishAsset.js';
import { archiveAssetTool, ArchiveAssetToolParams } from './archiveAsset.js';
import {
  unarchiveAssetTool,
  UnarchiveAssetToolParams,
} from './unarchiveAsset.js';
import type { ContentfulConfig } from '../../config/types.js';

export function createAssetTools(config: ContentfulConfig) {
  const uploadAsset = uploadAssetTool(config);
  const listAssets = listAssetsTool(config);
  const getAsset = getAssetTool(config);
  const updateAsset = updateAssetTool(config);
  const deleteAsset = deleteAssetTool(config);
  const publishAsset = publishAssetTool(config);
  const unpublishAsset = unpublishAssetTool(config);
  const archiveAsset = archiveAssetTool(config);
  const unarchiveAsset = unarchiveAssetTool(config);

  return {
    uploadAsset: {
      title: 'upload_asset',
      description: 'Upload a new asset',
      inputParams: UploadAssetToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: uploadAsset,
    },
    listAssets: {
      title: 'list_assets',
      description:
        'List assets in a space. Returns a maximum of 3 items per request. Use skip parameter to paginate through results.',
      inputParams: ListAssetsToolParams.shape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
      tool: listAssets,
    },
    getAsset: {
      title: 'get_asset',
      description: 'Retrieve an asset',
      inputParams: GetAssetToolParams.shape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
      tool: getAsset,
    },
    updateAsset: {
      title: 'update_asset',
      description: 'Update an asset',
      inputParams: UpdateAssetToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: updateAsset,
    },
    deleteAsset: {
      title: 'delete_asset',
      description: 'Delete an asset',
      inputParams: DeleteAssetToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: deleteAsset,
    },
    publishAsset: {
      title: 'publish_asset',
      description:
        'Publish an asset or multiple assets. Accepts either a single assetId (string) or an array of assetIds (up to 100 assets). For a single asset, it uses the standard publish operation. For multiple assets, it automatically uses bulk publishing.',
      inputParams: PublishAssetToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: publishAsset,
    },
    unpublishAsset: {
      title: 'unpublish_asset',
      description:
        'Unpublish an asset or multiple assets. Accepts either a single assetId (string) or an array of assetIds (up to 100 assets). For a single asset, it uses the standard unpublish operation. For multiple assets, it automatically uses bulk unpublishing.',
      inputParams: UnpublishAssetToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: unpublishAsset,
    },
    archiveAsset: {
      title: 'archive_asset',
      description:
        'Archive an asset or multiple assets. Archives assets that are no longer needed but should be preserved. Assets must be unpublished before they can be archived. Accepts either a single assetId (string) or an array of assetIds (up to 100 assets). For multiple assets, processes each one sequentially as a pseudo-bulk operation.',
      inputParams: ArchiveAssetToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: archiveAsset,
    },
    unarchiveAsset: {
      title: 'unarchive_asset',
      description:
        'Unarchive an asset or multiple assets. Restores archived assets, making them available for editing and publishing again. Accepts either a single assetId (string) or an array of assetIds (up to 100 assets). For multiple assets, processes each one sequentially as a pseudo-bulk operation.',
      inputParams: UnarchiveAssetToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: unarchiveAsset,
    },
  };
}
