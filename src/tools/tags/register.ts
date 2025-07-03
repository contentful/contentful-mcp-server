import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listTagsTool, ListTagsToolParams } from './listTags.js';

export function registerTagsTools(server: McpServer) {
  server.tool(
    'list_tags',
    'List all tags in a space. Returns all tags that exist in a given environment.',
    ListTagsToolParams.shape,
    listTagsTool,
  );
}
