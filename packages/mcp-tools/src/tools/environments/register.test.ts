import { describe, it, expect, vi } from 'vitest';
import {
  registerCreateEnvironmentTool,
  registerDeleteEnvironmentTool,
  registerListEnvironmentsTool,
} from './register.js';
import { CreateEnvironmentToolParams } from './createEnvironment.js';
import { ListEnvironmentsToolParams } from './listEnvironments.js';
import { DeleteEnvironmentToolParams } from './deleteEnvironment.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('environment registration helpers', () => {
  it('should register all environment tools', () => {
    const mockServer = {
      registerTool: vi.fn(),
    };

    registerCreateEnvironmentTool(mockServer as unknown as McpServer);
    registerListEnvironmentsTool(mockServer as unknown as McpServer);
    registerDeleteEnvironmentTool(mockServer as unknown as McpServer);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'create_environment',
      {
        description: 'Create a new environment',
        inputSchema: CreateEnvironmentToolParams.shape,
      },
      expect.any(Function),
    );

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'list_environments',
      {
        description: 'List all environments in a space',
        inputSchema: ListEnvironmentsToolParams.shape,
      },
      expect.any(Function),
    );

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'delete_environment',
      {
        description: 'Delete an environment',
        inputSchema: DeleteEnvironmentToolParams.shape,
      },
      expect.any(Function),
    );

    expect(mockServer.registerTool).toHaveBeenCalledTimes(3);
  });
});
