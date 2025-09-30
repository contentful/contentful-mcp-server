import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getLocaleTool, GetLocaleToolParams } from './getLocale.js';
import { createLocaleTool, CreateLocaleToolParams } from './createLocale.js';
import { listLocaleTool, ListLocaleToolParams } from './listLocales.js';
import { updateLocaleTool, UpdateLocaleToolParams } from './updateLocale.js';
import { deleteLocaleTool, DeleteLocaleToolParams } from './deleteLocale.js';

export function registerGetLocaleTool(server: McpServer) {
  return server.registerTool(
    'get_locale',
    {
      description:
        'Retrieve a specific locale from your Contentful environment',
      inputSchema: GetLocaleToolParams.shape,
    },
    getLocaleTool,
  );
}

export function registerCreateLocaleTool(server: McpServer) {
  return server.registerTool(
    'create_locale',
    {
      description:
        'Create a new locale in your Contentful environment. A locale defines a language-region pair (e.g., "en-US" for English United States). You can specify fallback behavior, API availability settings, and whether the locale is optional for content editors. Note: setting \'default\' is currently not supported.',
      inputSchema: CreateLocaleToolParams.shape,
    },
    createLocaleTool,
  );
}

export function registerListLocalesTool(server: McpServer) {
  return server.registerTool(
    'list_locales',
    {
      description:
        'List all locales in your Contentful environment. Returns locale information including language codes, fallback settings, and API availability.',
      inputSchema: ListLocaleToolParams.shape,
    },
    listLocaleTool,
  );
}

export function registerUpdateLocaleTool(server: McpServer) {
  return server.registerTool(
    'update_locale',
    {
      description:
        'Update an existing locale in your Contentful environment. You can modify the locale name, code, fallback behavior, API availability settings, and whether the locale is optional for content editors. Only provide the fields you want to change. IMPORTANT: internal_code cannot be updated.',
      inputSchema: UpdateLocaleToolParams.shape,
    },
    updateLocaleTool,
  );
}

export function registerDeleteLocaleTool(server: McpServer) {
  return server.registerTool(
    'delete_locale',
    {
      description:
        'Delete a specific locale from your Contentful environment. This operation permanently removes the locale and cannot be undone.',
      inputSchema: DeleteLocaleToolParams.shape,
    },
    deleteLocaleTool,
  );
}
