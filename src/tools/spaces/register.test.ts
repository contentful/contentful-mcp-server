import { describe, it, expect, vi } from 'vitest';
import { registerSpaceTools } from './register.js';
import { ListSpacesToolParams } from './listSpaces.js';
import { GetSpaceToolParams } from './getSpace.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('registerSpaceTools', () => {
  it('should register all space tools', () => {
    const mockServer = {
      tool: vi.fn(),
    };

    registerSpaceTools(mockServer as unknown as McpServer);

    expect(mockServer.tool).toHaveBeenCalledWith(
      'list_spaces',
      'List all available spaces',
      ListSpacesToolParams.shape,
      expect.any(Function),
    );

    expect(mockServer.tool).toHaveBeenCalledWith(
      'get_space',
      'Get details of a space',
      GetSpaceToolParams.shape,
      expect.any(Function),
    );

    expect(mockServer.tool).toHaveBeenCalledTimes(2);
  });
});
