import { listSpacesTool, ListSpacesToolParams } from './listSpaces.js';
import { getSpaceTool, GetSpaceToolParams } from './getSpace.js';

export const spaceTools = {
  listSpaces: {
    title: 'list_spaces',
    description: 'List all available spaces',
    inputParams: ListSpacesToolParams.shape,
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
    tool: listSpacesTool,
  },
  getSpace: {
    title: 'get_space',
    description: 'Get details of a space',
    inputParams: GetSpaceToolParams.shape,
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
    tool: getSpaceTool,
  },
};
