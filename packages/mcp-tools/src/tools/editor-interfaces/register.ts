import {
  listEditorInterfacesTool,
  ListEditorInterfacesToolParams,
} from './listEditorInterfaces.js';
import {
  getEditorInterfaceTool,
  GetEditorInterfaceToolParams,
} from './getEditorInterface.js';
import {
  updateEditorInterfaceTool,
  UpdateEditorInterfaceToolParams,
} from './updateEditorInterface.js';
import type { ContentfulConfig } from '../../config/types.js';

export function createEditorInterfaceTools(config: ContentfulConfig) {
  const listEditorInterfaces = listEditorInterfacesTool(config);
  const getEditorInterface = getEditorInterfaceTool(config);
  const updateEditorInterface = updateEditorInterfaceTool(config);

  return {
    listEditorInterfaces: {
      title: 'list_editor_interfaces',
      description:
        'Get all editor interfaces of a space. Returns configuration for how content types are displayed and edited in the Contentful web app, including field controls, sidebars, and layout settings.',
      inputParams: ListEditorInterfacesToolParams.shape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
      tool: listEditorInterfaces,
    },
    getEditorInterface: {
      title: 'get_editor_interface',
      description:
        'Get the editor interface for a specific content type. Returns detailed configuration including field controls (widgets), sidebar widgets, editor layout, and group controls that define how the content type is displayed and edited in the Contentful web app.',
      inputParams: GetEditorInterfaceToolParams.shape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
      tool: getEditorInterface,
    },
    updateEditorInterface: {
      title: 'update_editor_interface',
      description:
        'Update the editor interface for a content type. Allows customization of field controls (widgets), sidebar widgets, editor layout, and group controls. Only provide the properties you want to change - existing values will be preserved for unprovided fields.',
      inputParams: UpdateEditorInterfaceToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: updateEditorInterface,
    },
  };
}
