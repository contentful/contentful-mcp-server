import {
  getDataAssemblyTool,
  GetDataAssemblyToolParams,
} from './getDataAssembly.js';
import {
  getPublishedDataAssemblyTool,
  GetPublishedDataAssemblyToolParams,
} from './getPublishedDataAssembly.js';
import {
  listDataAssembliesTool,
  ListDataAssembliesToolParams,
} from './listDataAssemblies.js';
import {
  listPublishedDataAssembliesTool,
  ListPublishedDataAssembliesToolParams,
} from './listPublishedDataAssemblies.js';
import {
  createDataAssemblyTool,
  CreateDataAssemblyToolParams,
} from './createDataAssembly.js';
import {
  updateDataAssemblyTool,
  UpdateDataAssemblyToolParams,
} from './updateDataAssembly.js';
import {
  deleteDataAssemblyTool,
  DeleteDataAssemblyToolParams,
} from './deleteDataAssembly.js';
import {
  publishDataAssemblyTool,
  PublishDataAssemblyToolParams,
} from './publishDataAssembly.js';
import {
  unpublishDataAssemblyTool,
  UnpublishDataAssemblyToolParams,
} from './unpublishDataAssembly.js';
import type { ContentfulConfig } from '../../../config/types.js';

export function createDataAssemblyTools(config: ContentfulConfig) {
  const getDataAssembly = getDataAssemblyTool(config);
  const getPublishedDataAssembly = getPublishedDataAssemblyTool(config);
  const listDataAssemblies = listDataAssembliesTool(config);
  const listPublishedDataAssemblies = listPublishedDataAssembliesTool(config);
  const createDataAssembly = createDataAssemblyTool(config);
  const updateDataAssembly = updateDataAssemblyTool(config);
  const deleteDataAssembly = deleteDataAssemblyTool(config);
  const publishDataAssembly = publishDataAssemblyTool(config);
  const unpublishDataAssembly = unpublishDataAssemblyTool(config);

  return {
    getDataAssembly: {
      title: 'get_data_assembly',
      description:
        'Get details about a specific ExO DataAssembly (a smart data recipe that specifies how to fetch and reshape data for a component or page in a single operation).',
      inputParams: GetDataAssemblyToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: getDataAssembly,
    },
    getPublishedDataAssembly: {
      title: 'get_published_data_assembly',
      description:
        'Get details about a specific published ExO DataAssembly by ID.',
      inputParams: GetPublishedDataAssemblyToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: getPublishedDataAssembly,
    },
    listDataAssemblies: {
      title: 'list_data_assemblies',
      description:
        'List ExO DataAssemblies in a space and environment. Returns a maximum of 10 items per request; use the pageNext cursor (returned in pages.next) to paginate.',
      inputParams: ListDataAssembliesToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: listDataAssemblies,
    },
    listPublishedDataAssemblies: {
      title: 'list_published_data_assemblies',
      description:
        'List published ExO DataAssemblies in a space and environment. Returns a maximum of 10 items per request; use the pageNext cursor (returned in pages.next) to paginate.',
      inputParams: ListPublishedDataAssembliesToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: listPublishedDataAssemblies,
    },
    createDataAssembly: {
      title: 'create_data_assembly',
      description: 'Create a new ExO DataAssembly.',
      inputParams: CreateDataAssemblyToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: createDataAssembly,
    },
    updateDataAssembly: {
      title: 'update_data_assembly',
      description:
        'Update an existing ExO DataAssembly. You MUST call get_data_assembly first to read the current state, then pass the sys.version you received as the version parameter. The handler merges your updates with the existing data assembly fields, so you only need to provide the fields you want to change. If the version is stale (the data assembly changed since you read it), the update is rejected and you must re-fetch with get_data_assembly.',
      inputParams: UpdateDataAssemblyToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: updateDataAssembly,
    },
    deleteDataAssembly: {
      title: 'delete_data_assembly',
      description:
        'Delete an ExO DataAssembly. Two-phase: the first call (without confirm/confirmToken) returns a preview and a confirmToken. To complete the deletion, call again with the same dataAssemblyId, confirm: true, and the confirmToken from the preview.',
      inputParams: DeleteDataAssemblyToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: deleteDataAssembly,
    },
    publishDataAssembly: {
      title: 'publish_data_assembly',
      description:
        'Publish an ExO DataAssembly. You MUST call get_data_assembly first and pass the returned sys.version as the version parameter. If the version is stale the operation is rejected and you must re-fetch with get_data_assembly.',
      inputParams: PublishDataAssemblyToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: publishDataAssembly,
    },
    unpublishDataAssembly: {
      title: 'unpublish_data_assembly',
      description:
        'Unpublish an ExO DataAssembly. You MUST call get_data_assembly first and pass the returned sys.version as the version parameter. If the version is stale the operation is rejected and you must re-fetch with get_data_assembly.',
      inputParams: UnpublishDataAssemblyToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: unpublishDataAssembly,
    },
  };
}
