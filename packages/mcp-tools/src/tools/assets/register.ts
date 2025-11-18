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

export const assetTools = {
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
    tool: uploadAssetTool,
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
    tool: listAssetsTool,
  },
  getAsset: {
    title: 'get_asset',
    description: 'Retrieve an asset',
    inputParams: GetAssetToolParams.shape,
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
    tool: getAssetTool,
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
    tool: updateAssetTool,
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
    tool: deleteAssetTool,
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
    tool: publishAssetTool,
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
    tool: unpublishAssetTool,
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
    tool: archiveAssetTool,
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
    tool: unarchiveAssetTool,
  },
};
