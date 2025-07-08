import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  createAiActionTool,
  CreateAiActionToolParams,
} from './createAiAction.js';

export function registerAiActionsTools(server: McpServer) {
  server.tool(
    'create_ai_action',
    'Create a new AI action',
    CreateAiActionToolParams.shape,
    createAiActionTool,
  );
}
