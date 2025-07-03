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

export function registerEntriesTools(server: McpServer) {
  server.tool(
    'search_entries',
    'Search for specific entries in your Contentful space',
    SearchEntriesToolParams.shape,
    searchEntriesTool,
  );

  server.tool(
    'create_entry',
    "Create a new entry in Contentful. Before executing this function, you need to know the contentTypeId (not the content type NAME) and the fields of that contentType. You can get the fields definition by using the GET_CONTENT_TYPE tool. IMPORTANT: All field values MUST include a locale key (e.g., 'en-US') for each value, like: { title: { 'en-US': 'My Title' } }. Every field in Contentful requires a locale even for single-language content. TAGS: To add tags to an entry, include a metadata object with a tags array. Each tag should be an object with sys.type='Link', sys.linkType='Tag', and sys.id='tagId'. Example: { metadata: { tags: [{ sys: { type: 'Link', linkType: 'Tag', id: 'myTagId' } }] } }.",
    CreateEntryToolParams.shape,
    createEntryTool,
  );

  server.tool(
    'get_entry',
    'Retrieve an existing entry',
    GetEntryToolParams.shape,
    getEntryTool,
  );

  server.tool(
    'update_entry',
    "Update an existing entry. The handler will merge your field updates with the existing entry fields, so you only need to provide the fields and locales you want to change. IMPORTANT: All field values MUST include a locale key (e.g., 'en-US') for each value, like: { title: { 'en-US': 'My Updated Title' } }. Every field in Contentful requires a locale even for single-language content.",
    UpdateEntryToolParams.shape,
    updateEntryTool,
  );

  server.tool(
    'delete_entry',
    'Delete a specific content entry from your Contentful space',
    DeleteEntryToolParams.shape,
    deleteEntryTool,
  );

  server.tool(
    'publish_entry',
    'Publish an entry or multiple entries. Accepts either a single entryId (string) or an array of entryIds (up to 100 entries). For a single entry, it uses the standard publish operation. For multiple entries, it automatically uses bulk publishing.',
    PublishEntryToolParams.shape,
    publishEntryTool,
  );

  server.tool(
    'unpublish_entry',
    'Unpublish an entry or multiple entries. Accepts either a single entryId (string) or an array of entryIds (up to 100 entries). For a single entry, it uses the standard unpublish operation. For multiple entries, it automatically uses bulk unpublishing.',
    UnpublishEntryToolParams.shape,
    unpublishEntryTool,
  );
}
