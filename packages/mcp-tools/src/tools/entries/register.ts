import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { searchEntriesTool, SearchEntriesToolParams } from './searchEntries.js';
import { createEntryTool, CreateEntryToolParams } from './createEntry.js';
import { deleteEntryTool, DeleteEntryToolParams } from './deleteEntry.js';
import { updateEntryTool, UpdateEntryToolParams } from './updateEntry.js';
import { getEntryTool, GetEntryToolParams } from './getEntry.js';
import { publishEntryTool, PublishEntryToolParams } from './publishEntry.js';
import {
  unpublishEntryTool,
  UnpublishEntryToolParams,
} from './unpublishEntry.js';

export function registerSearchEntriesTool(server: McpServer) {
  return server.registerTool(
    'search_entries',
    {
      description: 'Search for specific entries in your Contentful space',
      inputSchema: SearchEntriesToolParams.shape,
    },
    searchEntriesTool,
  );
}

export function registerCreateEntryTool(server: McpServer) {
  return server.registerTool(
    'create_entry',
    {
      description:
        "Create a new entry in Contentful. Before executing this function, you need to know the contentTypeId (not the content type NAME) and the fields of that contentType. You can get the fields definition by using the GET_CONTENT_TYPE tool. IMPORTANT: All field values MUST include a locale key (e.g., 'en-US') for each value, like: { title: { 'en-US': 'My Title' } }. Every field in Contentful requires a locale even for single-language content. TAGS: To add tags to an entry, include a metadata object with a tags array. Each tag should be an object with sys.type='Link', sys.linkType='Tag', and sys.id='tagId'. Example: { metadata: { tags: [{ sys: { type: 'Link', linkType: 'Tag', id: 'myTagId' } }] } }.",
      inputSchema: CreateEntryToolParams.shape,
    },
    createEntryTool,
  );
}

export function registerGetEntryTool(server: McpServer) {
  return server.registerTool(
    'get_entry',
    {
      description: 'Retrieve an existing entry',
      inputSchema: GetEntryToolParams.shape,
    },
    getEntryTool,
  );
}

export function registerUpdateEntryTool(server: McpServer) {
  return server.registerTool(
    'update_entry',
    {
      description:
        "Update an existing entry. The handler will merge your field updates with the existing entry fields, so you only need to provide the fields you want to change. However, for multiple-locale fields, all existing locales must be included in the update. IMPORTANT: All field values MUST include a locale key (e.g., 'en-US') for each value, like: { title: { 'en-US': 'My Updated Title' } }. Every field in Contentful requires a locale even for single-language content. When updating entries with multiple locales, always include all existing locales in the update to prevent overwriting with empty values. RICH TEXT FIELDS: When updating rich text fields, ALL text nodes MUST include a 'marks' property (can be empty array [] for no formatting). Text nodes with formatting need appropriate marks: { nodeType: 'text', value: 'Bold text', marks: [{ type: 'bold' }], data: {} }.",
      inputSchema: UpdateEntryToolParams.shape,
    },
    updateEntryTool,
  );
}

export function registerDeleteEntryTool(server: McpServer) {
  return server.registerTool(
    'delete_entry',
    {
      description: 'Delete a specific content entry from your Contentful space',
      inputSchema: DeleteEntryToolParams.shape,
    },
    deleteEntryTool,
  );
}

export function registerPublishEntryTool(server: McpServer) {
  return server.registerTool(
    'publish_entry',
    {
      description:
        'Publish an entry or multiple entries. Accepts either a single entryId (string) or an array of entryIds (up to 100 entries). For a single entry, it uses the standard publish operation. For multiple entries, it automatically uses bulk publishing.',
      inputSchema: PublishEntryToolParams.shape,
    },
    publishEntryTool,
  );
}

export function registerUnpublishEntryTool(server: McpServer) {
  return server.registerTool(
    'unpublish_entry',
    {
      description:
        'Unpublish an entry or multiple entries. Accepts either a single entryId (string) or an array of entryIds (up to 100 entries). For a single entry, it uses the standard unpublish operation. For multiple entries, it automatically uses bulk unpublishing.',
      inputSchema: UnpublishEntryToolParams.shape,
    },
    unpublishEntryTool,
  );
}
