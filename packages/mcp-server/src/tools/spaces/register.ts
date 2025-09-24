import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listSpacesTool, ListSpacesToolParams } from './listSpaces.js';
import { getSpaceTool, GetSpaceToolParams } from './getSpace.js';

export function registerSpaceTools(server: McpServer) {
  server.tool(
    'list_spaces',
    'List all available spaces',
    ListSpacesToolParams.shape,
    listSpacesTool,
  );

  server.tool(
    'get_space',
    'Get details of a space',
    GetSpaceToolParams.shape,
    getSpaceTool,
  );
}
