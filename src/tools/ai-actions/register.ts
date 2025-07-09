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
    'Invoke an AI action with variables, multiple fields can be invoked at once by adding multiple items to the items array. If using locales, use IETF language tag format, e.g. \'en-US\' or \'de-DE\'. IMPORTANT: Variables can be provided in two formats: (1) String values - for simple text input that only returns the AI result without updating content, or (2) Entity references - to directly read from AND update specific entry fields. Entity reference format: {"entityId": "entryId", "entityPath": "fields.fieldName.locale", "entityType": "Entry"}. Use entity references when you want the AI action to automatically update the content in Contentful, not just return a translation result.',
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
