import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getContentTypeTool, GetContentTypeToolParams } from './getContentType.js';
import { listContentTypesTool, ListContentTypesToolParams } from './listContentTypes.js';

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
} 