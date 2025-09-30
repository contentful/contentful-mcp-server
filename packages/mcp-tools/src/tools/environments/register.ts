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

export function registerEnvironmentTools(server: McpServer) {
  server.tool(
    'create_environment',
    'Create a new environment',
    CreateEnvironmentToolParams.shape,
    createEnvironmentTool,
  );

  server.tool(
    'list_environments',
    'List all environments in a space',
    ListEnvironmentsToolParams.shape,
    listEnvironmentsTool,
  );

  server.tool(
    'delete_environment',
    'Delete an environment',
    DeleteEnvironmentToolParams.shape,
    deleteEnvironmentTool,
  );
}
