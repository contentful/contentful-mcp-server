import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
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

export function registerAssetTools(server: McpServer) {
  server.tool(
    'upload_asset',
    'Upload a new asset',
    UploadAssetToolParams.shape,
    uploadAssetTool,
  );

  server.tool(
    'list_assets',
    'List assets in a space. Returns a maximum of 3 items per request. Use skip parameter to paginate through results.',
    ListAssetsToolParams.shape,
    listAssetsTool,
  );

  server.tool(
    'get_asset',
    'Retrieve an asset',
    GetAssetToolParams.shape,
    getAssetTool,
  );

  server.tool(
    'update_asset',
    'Update an asset',
    UpdateAssetToolParams.shape,
    updateAssetTool,
  );

  server.tool(
    'delete_asset',
    'Delete an asset',
    DeleteAssetToolParams.shape,
    deleteAssetTool,
  );

  server.tool(
    'publish_asset',
    'Publish an asset or multiple assets. Accepts either a single assetId (string) or an array of assetIds (up to 100 assets). For a single asset, it uses the standard publish operation. For multiple assets, it automatically uses bulk publishing.',
    PublishAssetToolParams.shape,
    publishAssetTool,
  );

  server.tool(
    'unpublish_asset',
    'Unpublish an asset or multiple assets. Accepts either a single assetId (string) or an array of assetIds (up to 100 assets). For a single asset, it uses the standard unpublish operation. For multiple assets, it automatically uses bulk unpublishing.',
    UnpublishAssetToolParams.shape,
    unpublishAssetTool,
  );
}
