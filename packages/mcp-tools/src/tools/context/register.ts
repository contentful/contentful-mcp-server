import {
  getInitialContextTool,
  GetInitialContextToolParams,
} from './getInitialContextTool.js';

export const contextTools = {
  getInitialContext: {
    title: 'get_initial_context',
    description:
      'IMPORTANT: This tool must be called before using any other tools. It will get initial context and usage instructions for this MCP server. ',
    inputParams: GetInitialContextToolParams.shape,
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
    tool: getInitialContextTool,
  },
};
