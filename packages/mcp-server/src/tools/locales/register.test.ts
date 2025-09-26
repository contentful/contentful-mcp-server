import { describe, it, expect, vi } from 'vitest';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerLocaleTools } from './register.js';
import { getLocaleTool, GetLocaleToolParams } from './getLocale.js';
import { createLocaleTool, CreateLocaleToolParams } from './createLocale.js';
import { listLocaleTool, ListLocaleToolParams } from './listLocales.js';
import { updateLocaleTool, UpdateLocaleToolParams } from './updateLocale.js';
import { deleteLocaleTool, DeleteLocaleToolParams } from './deleteLocale.js';

describe('registerLocaleTools', () => {
  it('should register all locale tools with the server', () => {
    const mockServer = {
      tool: vi.fn(),
    };

    registerLocaleTools(mockServer as unknown as McpServer);

    expect(mockServer.tool).toHaveBeenCalledTimes(5);

    expect(mockServer.tool).toHaveBeenCalledWith(
      'get_locale',
      expect.any(String),
      GetLocaleToolParams.shape,
      getLocaleTool,
    );

    expect(mockServer.tool).toHaveBeenCalledWith(
      'create_locale',
      expect.any(String),
      CreateLocaleToolParams.shape,
      createLocaleTool,
    );

    expect(mockServer.tool).toHaveBeenCalledWith(
      'list_locales',
      expect.any(String),
      ListLocaleToolParams.shape,
      listLocaleTool,
    );

    expect(mockServer.tool).toHaveBeenCalledWith(
      'update_locale',
      expect.any(String),
      UpdateLocaleToolParams.shape,
      updateLocaleTool,
    );

    expect(mockServer.tool).toHaveBeenCalledWith(
      'delete_locale',
      expect.any(String),
      DeleteLocaleToolParams.shape,
      deleteLocaleTool,
    );
  });
});
