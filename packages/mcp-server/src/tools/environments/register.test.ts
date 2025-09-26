import { describe, it, expect, vi } from 'vitest';
import { registerEnvironmentTools } from './register.js';
import { CreateEnvironmentToolParams } from './createEnvironment.js';
import { ListEnvironmentsToolParams } from './listEnvironments.js';
import { DeleteEnvironmentToolParams } from './deleteEnvironment.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('registerEnvironmentTools', () => {
  it('should register all environment tools', () => {
    const mockServer = {
      tool: vi.fn(),
    };

    registerEnvironmentTools(mockServer as unknown as McpServer);

    expect(mockServer.tool).toHaveBeenCalledWith(
      'create_environment',
      'Create a new environment',
      CreateEnvironmentToolParams.shape,
      expect.any(Function),
    );

    expect(mockServer.tool).toHaveBeenCalledWith(
      'list_environments',
      'List all environments in a space',
      ListEnvironmentsToolParams.shape,
      expect.any(Function),
    );

    expect(mockServer.tool).toHaveBeenCalledWith(
      'delete_environment',
      'Delete an environment',
      DeleteEnvironmentToolParams.shape,
      expect.any(Function),
    );

    expect(mockServer.tool).toHaveBeenCalledTimes(3);
  });
});
