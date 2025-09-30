import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  createEnvironmentTool,
  CreateEnvironmentToolParams,
} from './createEnvironment.js';
import {
  listEnvironmentsTool,
  ListEnvironmentsToolParams,
} from './listEnvironments.js';
import {
  deleteEnvironmentTool,
  DeleteEnvironmentToolParams,
} from './deleteEnvironment.js';

export function registerCreateEnvironmentTool(server: McpServer) {
  return server.registerTool(
    'create_environment',
    {
      description: 'Create a new environment',
      inputSchema: CreateEnvironmentToolParams.shape,
    },
    createEnvironmentTool,
  );
}

export function registerListEnvironmentsTool(server: McpServer) {
  return server.registerTool(
    'list_environments',
    {
      description: 'List all environments in a space',
      inputSchema: ListEnvironmentsToolParams.shape,
    },
    listEnvironmentsTool,
  );
}

export function registerDeleteEnvironmentTool(server: McpServer) {
  return server.registerTool(
    'delete_environment',
    {
      description: 'Delete an environment',
      inputSchema: DeleteEnvironmentToolParams.shape,
    },
    deleteEnvironmentTool,
  );
}
