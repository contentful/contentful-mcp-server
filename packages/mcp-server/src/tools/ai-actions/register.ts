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
import {
  deleteAiActionTool,
  DeleteAiActionToolParams,
} from './deleteAiAction.js';
import { getAiActionTool, GetAiActionToolParams } from './getAiAction.js';
import { listAiActionTool, ListAiActionToolParams } from './listAiActions.js';
import {
  publishAiActionTool,
  PublishAiActionToolParams,
} from './publishAiAction.js';
import {
  unpublishAiActionTool,
  UnpublishAiActionToolParams,
} from './unpublishAiAction.js';
import {
  updateAiActionTool,
  UpdateAiActionToolParams,
} from './updateAiAction.js';

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

  server.tool(
    'delete_ai_action',
    'Delete a specific AI action from your Contentful space',
    DeleteAiActionToolParams.shape,
    deleteAiActionTool,
  );

  server.tool(
    'get_ai_action',
    'Retrieve details about a specific AI action including its configuration, instructions, and defined variables',
    GetAiActionToolParams.shape,
    getAiActionTool,
  );

  server.tool(
    'list_ai_actions',
    'List AI actions in a space. Returns a maximum of 3 items per request. Use skip parameter to paginate through results.',
    ListAiActionToolParams.shape,
    listAiActionTool,
  );

  server.tool(
    'publish_ai_action',
    'Publish an AI action to make it available for use in the Contentful web app',
    PublishAiActionToolParams.shape,
    publishAiActionTool,
  );

  server.tool(
    'unpublish_ai_action',
    'Unpublish an AI action to remove it from use in the Contentful web app',
    UnpublishAiActionToolParams.shape,
    unpublishAiActionTool,
  );

  server.tool(
    'update_ai_action',
    'Update an existing AI action. Your updates will be merged with the existing AI action data, so you only need to provide the fields you want to change.',
    UpdateAiActionToolParams.shape,
    updateAiActionTool,
  );
}
