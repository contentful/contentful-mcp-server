import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getInitialContextTool,
  GetInitialContextToolParams,
} from './getInitialContextTool.js';

export function registerContextTools(server: McpServer) {
  server.registerTool(
    'get_initial_context',
    {
      description:
        'IMPORTANT: This tool must be called before using any other tools. It will get initial context and usage instructions for this MCP server. ',
      inputSchema: GetInitialContextToolParams.shape,
    },
    getInitialContextTool,
  );
}
