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
import type { ContentfulConfig } from '../../config/types.js';

export function createEnvironmentTools(config: ContentfulConfig) {
  const createEnvironment = createEnvironmentTool(config);
  const listEnvironments = listEnvironmentsTool(config);
  const deleteEnvironment = deleteEnvironmentTool(config);

  return {
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
      tool: createEnvironment,
    },
    listEnvironments: {
      title: 'list_environments',
      description: 'List all environments in a space',
      inputParams: ListEnvironmentsToolParams.shape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
      tool: listEnvironments,
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
      tool: deleteEnvironment,
    },
  };
}
