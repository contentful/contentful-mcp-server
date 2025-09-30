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
  server.registerTool(
    'upload_asset',
    {
      description: 'Upload a new asset',
      inputSchema: UploadAssetToolParams.shape,
    },
    uploadAssetTool,
  );

  server.registerTool(
    'list_assets',
    {
      description:
        'List assets in a space. Returns a maximum of 3 items per request. Use skip parameter to paginate through results.',
      inputSchema: ListAssetsToolParams.shape,
    },
    listAssetsTool,
  );

  server.registerTool(
    'get_asset',
    {
      description: 'Retrieve an asset',
      inputSchema: GetAssetToolParams.shape,
    },
    getAssetTool,
  );

  server.registerTool(
    'update_asset',
    {
      description: 'Update an asset',
      inputSchema: UpdateAssetToolParams.shape,
    },
    updateAssetTool,
  );

  server.registerTool(
    'delete_asset',
    {
      description: 'Delete an asset',
      inputSchema: DeleteAssetToolParams.shape,
    },
    deleteAssetTool,
  );

  server.registerTool(
    'publish_asset',
    {
      description:
        'Publish an asset or multiple assets. Accepts either a single assetId (string) or an array of assetIds (up to 100 assets). For a single asset, it uses the standard publish operation. For multiple assets, it automatically uses bulk publishing.',
      inputSchema: PublishAssetToolParams.shape,
    },
    publishAssetTool,
  );

  server.registerTool(
    'unpublish_asset',
    {
      description:
        'Unpublish an asset or multiple assets. Accepts either a single assetId (string) or an array of assetIds (up to 100 assets). For a single asset, it uses the standard unpublish operation. For multiple assets, it automatically uses bulk unpublishing.',
      inputSchema: UnpublishAssetToolParams.shape,
    },
    unpublishAssetTool,
  );
}
