import {
  getComponentTypeTool,
  GetComponentTypeToolParams,
} from './getComponentType.js';
import {
  listComponentTypesTool,
  ListComponentTypesToolParams,
} from './listComponentTypes.js';
import {
  createComponentTypeTool,
  CreateComponentTypeToolParams,
} from './createComponentType.js';
import {
  upsertComponentTypeTool,
  UpsertComponentTypeToolParams,
} from './upsertComponentType.js';
import {
  deleteComponentTypeTool,
  DeleteComponentTypeToolParams,
} from './deleteComponentType.js';
import {
  publishComponentTypeTool,
  PublishComponentTypeToolParams,
} from './publishComponentType.js';
import {
  unpublishComponentTypeTool,
  UnpublishComponentTypeToolParams,
} from './unpublishComponentType.js';
import type { ContentfulConfig } from '../../../config/types.js';

export function createComponentTypeTools(config: ContentfulConfig) {
  const getComponentType = getComponentTypeTool(config);
  const listComponentTypes = listComponentTypesTool(config);
  const createComponentType = createComponentTypeTool(config);
  const upsertComponentType = upsertComponentTypeTool(config);
  const deleteComponentType = deleteComponentTypeTool(config);
  const publishComponentType = publishComponentTypeTool(config);
  const unpublishComponentType = unpublishComponentTypeTool(config);

  return {
    getComponentType: {
      title: 'get_component_type',
      description:
        'Get details about a specific ExO component type (a reusable section/pattern template defining slots, content properties, and design properties).',
      inputParams: GetComponentTypeToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: getComponentType,
    },
    listComponentTypes: {
      title: 'list_component_types',
      description:
        'List ExO component types in a space and environment. Returns a maximum of 10 items per request; use the pageNext cursor (returned in pages.next) to paginate.',
      inputParams: ListComponentTypesToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: listComponentTypes,
    },
    createComponentType: {
      title: 'create_component_type',
      description: 'Create a new ExO component type.',
      inputParams: CreateComponentTypeToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: createComponentType,
    },
    upsertComponentType: {
      title: 'upsert_component_type',
      description:
        'Update an existing ExO component type. The handler fetches the current component type first (read-before-write) to obtain its version and to preserve any fields you do not supply, then writes the merged result via PUT.',
      inputParams: UpsertComponentTypeToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: upsertComponentType,
    },
    deleteComponentType: {
      title: 'delete_component_type',
      description:
        'Delete an ExO component type. Two-phase: the first call (without confirm/confirmToken) returns a preview and a confirmToken. To complete the deletion, call again with the same componentTypeId, confirm: true, and the confirmToken from the preview.',
      inputParams: DeleteComponentTypeToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: deleteComponentType,
    },
    publishComponentType: {
      title: 'publish_component_type',
      description: 'Publish an ExO component type.',
      inputParams: PublishComponentTypeToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: publishComponentType,
    },
    unpublishComponentType: {
      title: 'unpublish_component_type',
      description: 'Unpublish an ExO component type.',
      inputParams: UnpublishComponentTypeToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: unpublishComponentType,
    },
  };
}
