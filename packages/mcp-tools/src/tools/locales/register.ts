import { getLocaleTool, GetLocaleToolParams } from './getLocale.js';
import { createLocaleTool, CreateLocaleToolParams } from './createLocale.js';
import { listLocaleTool, ListLocaleToolParams } from './listLocales.js';
import { updateLocaleTool, UpdateLocaleToolParams } from './updateLocale.js';
import { deleteLocaleTool, DeleteLocaleToolParams } from './deleteLocale.js';

export const localeTools = {
  getLocale: {
    title: 'get_locale',
    description: 'Retrieve a specific locale from your Contentful environment',
    inputParams: GetLocaleToolParams.shape,
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
    tool: getLocaleTool,
  },
  createLocale: {
    title: 'create_locale',
    description:
      'Create a new locale in your Contentful environment. A locale defines a language-region pair (e.g., "en-US" for English United States). You can specify fallback behavior, API availability settings, and whether the locale is optional for content editors. Note: setting \'default\' is currently not supported.',
    inputParams: CreateLocaleToolParams.shape,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    tool: createLocaleTool,
  },
  listLocales: {
    title: 'list_locales',
    description:
      'List all locales in your Contentful environment. Returns locale information including language codes, fallback settings, and API availability.',
    inputParams: ListLocaleToolParams.shape,
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
    tool: listLocaleTool,
  },
  updateLocale: {
    title: 'update_locale',
    description:
      'Update an existing locale in your Contentful environment. You can modify the locale name, code, fallback behavior, API availability settings, and whether the locale is optional for content editors. Only provide the fields you want to change. IMPORTANT: internal_code cannot be updated.',
    inputParams: UpdateLocaleToolParams.shape,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    tool: updateLocaleTool,
  },
  deleteLocale: {
    title: 'delete_locale',
    description:
      'Delete a specific locale from your Contentful environment. This operation permanently removes the locale and cannot be undone.',
    inputParams: DeleteLocaleToolParams.shape,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    tool: deleteLocaleTool,
  },
};
