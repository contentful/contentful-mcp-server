import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listTagsTool, ListTagsToolParams } from './listTags.js';
import { createTagTool, CreateTagToolParams } from './createTag.js';

export function registerTagsTools(server: McpServer) {
  server.registerTool(
    'list_tags',
    {
      description:
        'List all tags in a space. Returns all tags that exist in a given environment.',
      inputSchema: ListTagsToolParams.shape,
    },
    listTagsTool,
  );

  server.registerTool(
    'create_tag',
    {
      description:
        'Creates a new tag and returns it. Both name and ID must be unique to each environment. Tag names can be modified after creation, but the tag ID cannot. The tag visibility can be set to public or private, defaulting to private if not specified.',
      inputSchema: CreateTagToolParams.shape,
    },
    createTagTool,
  );
}
