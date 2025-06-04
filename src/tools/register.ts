import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerContextTools } from './context/register.js';
import { registerEntriesTools } from './entries/register.js';

export function registerAllTools(server: McpServer) {
  registerContextTools(server);
  registerEntriesTools(server);
}
