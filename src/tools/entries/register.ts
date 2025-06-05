import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { searchEntriesTool, SearchEntriesToolParams } from './searchEntries.js';
import { createEntryTool, CreateEntryToolParams } from './createEntry.js';

export function registerEntriesTools(server: McpServer) {
  server.tool(
    'search_entries',
    'Search for specific entries in your Contentful space',
    SearchEntriesToolParams.shape,
    searchEntriesTool,
  );
  
  server.tool(
    'create_entry',
    "Create a new entry in Contentful. Before executing this function, you need to know the contentTypeId (not the content type NAME) and the fields of that contentType. You can get the fields definition by using the GET_CONTENT_TYPE tool. IMPORTANT: All field values MUST include a locale key (e.g., 'en-US') for each value, like: { title: { 'en-US': 'My Title' } }. Every field in Contentful requires a locale even for single-language content.",
    CreateEntryToolParams.shape,
    createEntryTool,
  );
}


