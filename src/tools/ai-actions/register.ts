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
    'Invoke an AI action with variables. BULK OPERATIONS: Always use bulk operations when processing multiple fields by adding multiple items to the fields array - this is more efficient than separate calls. IMPORTANT: Variables can be provided in two formats: (1) String values - for simple text input that only returns the AI result without updating content, or (2) Entity references - to directly read from specific entry fields. Entity reference format: {"entityId": "entryId", "entityPath": "fields.fieldName.locale", "entityType": "Entry"}. POLLING BEHAVIOR: This tool automatically polls for completion every 3 seconds for up to 60 seconds total. The action will fail if the AI action encounters an error or is cancelled. Only successfully completed actions are returned. CRITICAL: After invoking AI actions that modify entries or assets using entity references, you MUST call the appropriate update_entry or update_asset tool to push the changes to Contentful and make them visible. Always update the correct entity that was modified by the AI action.',
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
