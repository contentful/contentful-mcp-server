import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getContentTypeTool,
  GetContentTypeToolParams,
} from './getContentType.js';
import {
  listContentTypesTool,
  ListContentTypesToolParams,
} from './listContentTypes.js';
import {
  createContentTypeTool,
  CreateContentTypeToolParams,
} from './createContentType.js';
import {
  updateContentTypeTool,
  UpdateContentTypeToolParams,
} from './updateContentType.js';
import {
  deleteContentTypeTool,
  DeleteContentTypeToolParams,
} from './deleteContentType.js';
import {
  publishContentTypeTool,
  PublishContentTypeToolParams,
} from './publishContentType.js';
import {
  unpublishContentTypeTool,
  UnpublishContentTypeToolParams,
} from './unpublishContentType.js';

export function registerContentTypesTools(server: McpServer) {
  server.tool(
    'get_content_type',
    'Get details about a specific Contentful content type',
    GetContentTypeToolParams.shape,
    getContentTypeTool,
  );

  server.tool(
    'list_content_types',
    'List content types in a space. Returns a maximum of 10 items per request. Use skip parameter to paginate through results.',
    ListContentTypesToolParams.shape,
    listContentTypesTool,
  );

  server.tool(
    'create_content_type',
    'Create a new content type',
    CreateContentTypeToolParams.shape,
    createContentTypeTool,
  );

  server.tool(
    'update_content_type',
    'Update an existing content type. The handler will merge your field updates with existing content type data, so you only need to provide the fields and properties you want to change.',
    UpdateContentTypeToolParams.shape,
    updateContentTypeTool,
  );

  server.tool(
    'delete_content_type',
    'Delete a content type',
    DeleteContentTypeToolParams.shape,
    deleteContentTypeTool,
  );

  server.tool(
    'publish_content_type',
    'Publish a content type',
    PublishContentTypeToolParams.shape,
    publishContentTypeTool,
  );

  server.tool(
    'unpublish_content_type',
    'Unpublish a content type',
    UnpublishContentTypeToolParams.shape,
    unpublishContentTypeTool,
  );
}
