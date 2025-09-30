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
      registerTool: vi.fn(),
    };

    registerLocaleTools(mockServer as unknown as McpServer);

    expect(mockServer.registerTool).toHaveBeenCalledTimes(5);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'get_locale',
      {
        description: expect.any(String),
        inputSchema: GetLocaleToolParams.shape,
      },
      getLocaleTool,
    );

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'create_locale',
      {
        description: expect.any(String),
        inputSchema: CreateLocaleToolParams.shape,
      },
      createLocaleTool,
    );

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'list_locales',
      {
        description: expect.any(String),
        inputSchema: ListLocaleToolParams.shape,
      },
      listLocaleTool,
    );

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'update_locale',
      {
        description: expect.any(String),
        inputSchema: UpdateLocaleToolParams.shape,
      },
      updateLocaleTool,
    );

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'delete_locale',
      {
        description: expect.any(String),
        inputSchema: DeleteLocaleToolParams.shape,
      },
      deleteLocaleTool,
    );
  });
});
