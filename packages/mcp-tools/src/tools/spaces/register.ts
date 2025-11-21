import { listSpacesTool, ListSpacesToolParams } from './listSpaces.js';
import { getSpaceTool, GetSpaceToolParams } from './getSpace.js';
import type { ContentfulConfig } from '../../config/types.js';

export function createSpaceTools(config: ContentfulConfig) {
  const listSpaces = listSpacesTool(config);
  const getSpace = getSpaceTool(config);

  return {
    listSpaces: {
      title: 'list_spaces',
      description: 'List all available spaces',
      inputParams: ListSpacesToolParams.shape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
      tool: listSpaces,
    },
    getSpace: {
      title: 'get_space',
      description: 'Get details of a space',
      inputParams: GetSpaceToolParams.shape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
      tool: getSpace,
    },
  };
}
