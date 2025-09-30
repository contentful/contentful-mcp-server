import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listSpacesTool, ListSpacesToolParams } from './listSpaces.js';
import { getSpaceTool, GetSpaceToolParams } from './getSpace.js';

export function registerListSpacesTool(server: McpServer) {
  return server.registerTool(
    'list_spaces',
    {
      description: 'List all available spaces',
      inputSchema: ListSpacesToolParams.shape,
    },
    listSpacesTool,
  );
}

export function registerGetSpaceTool(server: McpServer) {
  return server.registerTool(
    'get_space',
    {
      description: 'Get details of a space',
      inputSchema: GetSpaceToolParams.shape,
    },
    getSpaceTool,
  );
}
