import { describe, it, expect, vi } from 'vitest';
import { registerSpaceTools } from './register.js';
import { ListSpacesToolParams } from './listSpaces.js';
import { GetSpaceToolParams } from './getSpace.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('registerSpaceTools', () => {
  it('should register all space tools', () => {
    const mockServer = {
      registerTool: vi.fn(),
    };

    registerSpaceTools(mockServer as unknown as McpServer);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'list_spaces',
      {
        description: 'List all available spaces',
        inputSchema: ListSpacesToolParams.shape,
      },
      expect.any(Function),
    );

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'get_space',
      {
        description: 'Get details of a space',
        inputSchema: GetSpaceToolParams.shape,
      },
      expect.any(Function),
    );

    expect(mockServer.registerTool).toHaveBeenCalledTimes(2);
  });
});
