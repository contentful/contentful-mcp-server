import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerSpaceToSpaceMigrationTools } from './space-to-space-migration/register.js';

export function registerWorkflows(server: McpServer) {
  registerSpaceToSpaceMigrationTools(server);
}
