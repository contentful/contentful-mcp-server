import {
  getInitialContextTool,
  GetInitialContextToolParams,
} from './getInitialContextTool.js';
import { getGuidanceTool, GetGuidanceToolParams } from './getGuidanceTool.js';
import { GUIDANCE_TOPICS } from './instructions.js';
import type { ContentfulConfig } from '../../config/types.js';

export function createContextTools(config: ContentfulConfig) {
  const getInitialContext = getInitialContextTool(config);
  const getGuidance = getGuidanceTool();

  return {
    getInitialContext: {
      title: 'get_initial_context',
      description:
        'IMPORTANT: This tool must be called before using any other tools. It will get initial context and usage instructions for this MCP server. ',
      inputParams: GetInitialContextToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: getInitialContext,
    },
    getGuidance: {
      title: 'get_guidance',
      description: `Retrieve detailed Contentful operating guidance for a specific topic. Call this when you need depth beyond the core rules from get_initial_context. Topics: ${GUIDANCE_TOPICS.join(', ')}.`,
      inputParams: GetGuidanceToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: getGuidance,
    },
  };
}
