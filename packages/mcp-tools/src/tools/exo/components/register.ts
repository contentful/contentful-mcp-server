import { getComponentTool, GetComponentToolParams } from './getComponent.js';
import {
  listComponentsTool,
  ListComponentsToolParams,
} from './listComponents.js';
import {
  createComponentTool,
  CreateComponentToolParams,
} from './createComponent.js';
import {
  upsertComponentTool,
  UpsertComponentToolParams,
} from './upsertComponent.js';
import {
  deleteComponentTool,
  DeleteComponentToolParams,
} from './deleteComponent.js';
import {
  publishComponentTool,
  PublishComponentToolParams,
} from './publishComponent.js';
import {
  unpublishComponentTool,
  UnpublishComponentToolParams,
} from './unpublishComponent.js';
import type { ContentfulConfig } from '../../../config/types.js';

export function createComponentTools(config: ContentfulConfig) {
  const getComponent = getComponentTool(config);
  const listComponents = listComponentsTool(config);
  const createComponent = createComponentTool(config);
  const upsertComponent = upsertComponentTool(config);
  const deleteComponent = deleteComponentTool(config);
  const publishComponent = publishComponentTool(config);
  const unpublishComponent = unpublishComponentTool(config);

  return {
    getComponent: {
      title: 'get_component',
      description:
        'Get details about a specific ExO component (a reusable section/pattern template defining slots, content properties, and design properties).',
      inputParams: GetComponentToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: getComponent,
    },
    listComponents: {
      title: 'list_components',
      description:
        'List ExO components in a space and environment. Returns a maximum of 10 items per request; use the pageNext cursor (returned in pages.next) to paginate.',
      inputParams: ListComponentsToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: listComponents,
    },
    createComponent: {
      title: 'create_component',
      description: 'Create a new ExO component.',
      inputParams: CreateComponentToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: createComponent,
    },
    upsertComponent: {
      title: 'upsert_component',
      description:
        'Update an existing ExO component. You MUST call get_component first to read the current state, then pass the sys.version you received as the version parameter. The handler merges your updates with the existing component fields, so you only need to provide the fields you want to change. If the version is stale (the component changed since you read it), the update is rejected and you must re-fetch with get_component.',
      inputParams: UpsertComponentToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: upsertComponent,
    },
    deleteComponent: {
      title: 'delete_component',
      description:
        'Delete an ExO component. Two-phase: the first call (without confirm/confirmToken) returns a preview and a confirmToken. To complete the deletion, call again with the same componentId, confirm: true, and the confirmToken from the preview.',
      inputParams: DeleteComponentToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: deleteComponent,
    },
    publishComponent: {
      title: 'publish_component',
      description:
        'Publish an ExO component. You MUST call get_component first and pass the returned sys.version as the version parameter. If the version is stale the operation is rejected and you must re-fetch with get_component.',
      inputParams: PublishComponentToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: publishComponent,
    },
    unpublishComponent: {
      title: 'unpublish_component',
      description:
        'Unpublish an ExO component. You MUST call get_component first and pass the returned sys.version as the version parameter. If the version is stale the operation is rejected and you must re-fetch with get_component.',
      inputParams: UnpublishComponentToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: unpublishComponent,
    },
  };
}
