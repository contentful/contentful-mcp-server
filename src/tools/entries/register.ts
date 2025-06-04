import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { searchEntriesTool, SearchEntriesToolParams } from './searchEntries.js';

export function registerEntriesTools(server: McpServer) {
  server.tool(
    'search_entries',
    'Search for specific entries in your Contentful space',
    SearchEntriesToolParams.shape,
    searchEntriesTool,
  );
}
