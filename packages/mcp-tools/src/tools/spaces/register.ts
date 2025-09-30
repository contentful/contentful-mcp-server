import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listSpacesTool, ListSpacesToolParams } from './listSpaces.js';
import { getSpaceTool, GetSpaceToolParams } from './getSpace.js';

export function registerSpaceTools(server: McpServer) {
  server.registerTool(
    'list_spaces',
    {
      description: 'List all available spaces',
      inputSchema: ListSpacesToolParams.shape,
    },
    listSpacesTool,
  );

  server.registerTool(
    'get_space',
    {
      description: 'Get details of a space',
      inputSchema: GetSpaceToolParams.shape,
    },
    getSpaceTool,
  );
}
