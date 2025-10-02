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

export const environmentTools = {
  createEnvironment: {
    title: 'create_environment',
    description: 'Create a new environment',
    inputParams: CreateEnvironmentToolParams.shape,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    tool: createEnvironmentTool,
  },
  listEnvironments: {
    title: 'list_environments',
    description: 'List all environments in a space',
    inputParams: ListEnvironmentsToolParams.shape,
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
    tool: listEnvironmentsTool,
  },
  deleteEnvironment: {
    title: 'delete_environment',
    description: 'Delete an environment',
    inputParams: DeleteEnvironmentToolParams.shape,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    tool: deleteEnvironmentTool,
  },
};
