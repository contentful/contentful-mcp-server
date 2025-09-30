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

export function registerGetContentTypeTool(server: McpServer) {
  return server.registerTool(
    'get_content_type',
    {
      description: 'Get details about a specific Contentful content type',
      inputSchema: GetContentTypeToolParams.shape,
    },
    getContentTypeTool,
  );
}

export function registerListContentTypesTool(server: McpServer) {
  return server.registerTool(
    'list_content_types',
    {
      description:
        'List content types in a space. Returns a maximum of 10 items per request. Use skip parameter to paginate through results.',
      inputSchema: ListContentTypesToolParams.shape,
    },
    listContentTypesTool,
  );
}

export function registerCreateContentTypeTool(server: McpServer) {
  return server.registerTool(
    'create_content_type',
    {
      description: 'Create a new content type',
      inputSchema: CreateContentTypeToolParams.shape,
    },
    createContentTypeTool,
  );
}

export function registerUpdateContentTypeTool(server: McpServer) {
  return server.registerTool(
    'update_content_type',
    {
      description:
        'Update an existing content type. The handler will merge your field updates with existing content type data, so you only need to provide the fields and properties you want to change.',
      inputSchema: UpdateContentTypeToolParams.shape,
    },
    updateContentTypeTool,
  );
}

export function registerDeleteContentTypeTool(server: McpServer) {
  return server.registerTool(
    'delete_content_type',
    {
      description: 'Delete a content type',
      inputSchema: DeleteContentTypeToolParams.shape,
    },
    deleteContentTypeTool,
  );
}

export function registerPublishContentTypeTool(server: McpServer) {
  return server.registerTool(
    'publish_content_type',
    {
      description: 'Publish a content type',
      inputSchema: PublishContentTypeToolParams.shape,
    },
    publishContentTypeTool,
  );
}

export function registerUnpublishContentTypeTool(server: McpServer) {
  return server.registerTool(
    'unpublish_content_type',
    {
      description: 'Unpublish a content type',
      inputSchema: UnpublishContentTypeToolParams.shape,
    },
    unpublishContentTypeTool,
  );
}
