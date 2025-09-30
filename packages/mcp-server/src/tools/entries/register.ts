// This file now uses the registerEntriesTools function from @contentful/mcp-tools
// to demonstrate that the extracted tools work correctly when imported.

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerEntriesTools as registerEntriesToolsFromToolkit } from '@contentful/mcp-tools';

export function registerEntriesTools(server: McpServer) {
  // Use the registration function from the mcp-tools package
  registerEntriesToolsFromToolkit(server);
}
