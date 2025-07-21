import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getLocaleTool, GetLocaleToolParams } from './getLocale.js';
import { createLocaleTool, CreateLocaleToolParams } from './createLocale.js';
import { listLocaleTool, ListLocaleToolParams } from './listLocales.js';

export function registerLocaleTools(server: McpServer) {
  server.tool(
    'get_locale',
    'Retrieve a specific locale from your Contentful environment',
    GetLocaleToolParams.shape,
    getLocaleTool,
  );

  server.tool(
    'create_locale',
    'Create a new locale in your Contentful environment. A locale defines a language-region pair (e.g., "en-US" for English United States). You can specify fallback behavior, API availability settings, and whether the locale is optional for content editors. Note: setting \'default\' is currently not supported.',
    CreateLocaleToolParams.shape,
    createLocaleTool,
  );

  server.tool(
    'list_locales',
    'List all locales in your Contentful environment. Returns locale information including language codes, fallback settings, and API availability.',
    ListLocaleToolParams.shape,
    listLocaleTool,
  );
}
