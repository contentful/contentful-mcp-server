import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  createAiActionTool,
  CreateAiActionToolParams,
} from './createAiAction.js';
import {
  invokeAiActionTool,
  InvokeAiActionToolParams,
} from './invokeAiAction.js';
import {
  getAiActionInvocationTool,
  GetAiActionInvocationToolParams,
} from './getAiActionInvocation.js';

export function registerAiActionsTools(server: McpServer) {
  server.tool(
    'create_ai_action',
    'Create a new AI action with clear instructions and well-defined variables. Best practices: (1) Use descriptive names that indicate the action\'s purpose, (2) Write specific, actionable instructions in the template, (3) Define meaningful variables with clear names like "sourceContent", "targetLocale", "entryId", or "contentType", (4) Embed variables into the template using the format {{var.{variableId}}}, (5) Consider the content editor\'s workflow and make the action intuitive to use. Example variables: content fields to process, locales for translation, reference entries, formatting preferences, or validation rules.',
    CreateAiActionToolParams.shape,
    createAiActionTool,
  );

  server.tool(
    'invoke_ai_action',
    'Invoke an AI action with variables. MANDATORY BULK OPERATIONS: You MUST ALWAYS use bulk operations when processing multiple content pieces by adding multiple items to the fields array - never make separate calls. VARIABLES: Can be (1) String values for simple text input, or (2) Entity references to read from specific entry fields using {"entityId": "entryId", "entityPath": "fields.fieldName.locale", "entityType": "Entry"}. POLLING: Automatically polls every 3 seconds for up to 60 seconds. CRITICAL FOLLOW-UP: After invoking AI actions, you MUST immediately take the next step to complete the workflow. The tool response will provide specific guidance on required next steps - you must follow this guidance.',
    InvokeAiActionToolParams.shape,
    invokeAiActionTool,
  );

  server.tool(
    'get_ai_action_invocation',
    'Retrieve information about a specific AI action invocation by its ID.',
    GetAiActionInvocationToolParams.shape,
    getAiActionInvocationTool,
  );
}
