import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  aiActionTools,
  assetTools,
  contentTypeTools,
  contextTools,
  editorInterfaceTools,
  entryTools,
  environmentTools,
  jobTools,
  localeTools,
  orgTools,
  spaceTools,
  tagTools,
  taxonomyTools,
} from '@contentful/mcp-tools';

/**
 * Registers all Contentful MCP tools with the server.
 * Each tool is registered with its title, description, input schema, annotations, and implementation.
 *
 * Special handling for space-to-space migration workflow tools:
 * - The param collection, export, and import tools are disabled by default
 * - The migration handler controls their enable/disable state
 */
export function registerAllTools(server: McpServer): void {
  // Combine standard tool collections
  const allToolCollections = [
    aiActionTools,
    assetTools,
    contentTypeTools,
    contextTools,
    editorInterfaceTools,
    entryTools,
    environmentTools,
    localeTools,
    orgTools,
    spaceTools,
    tagTools,
    taxonomyTools,
  ];

  // Register each tool from standard collections
  allToolCollections.forEach((toolCollection) => {
    Object.values(toolCollection).forEach((tool) => {
      server.registerTool(
        tool.title,
        {
          description: tool.description,
          inputSchema: tool.inputParams,
          annotations: tool.annotations,
        },
        tool.tool,
      );
    });
  });

  // Handle migration tools specially
  // These tools should be disabled by default and controlled by the handler
  const workflowToolsToDisable = [
    'spaceToSpaceParamCollection',
    'exportSpace',
    'importSpace',
  ] as const;

  const registeredWorkflowTools = workflowToolsToDisable.map((toolKey) => {
    const toolConfig = jobTools[toolKey];
    const registeredTool = server.registerTool(
      toolConfig.title,
      {
        description: toolConfig.description,
        inputSchema: toolConfig.inputParams,
        annotations: toolConfig.annotations,
      },
      toolConfig.tool,
    );
    // Disable these tools by default - they'll be enabled by the migration handler
    registeredTool.disable();
    return registeredTool;
  });

  // Register the migration handler with references to the workflow tools
  const handlerConfig = jobTools.spaceToSpaceMigrationHandler;
  server.registerTool(
    handlerConfig.title,
    {
      description: handlerConfig.description,
      inputSchema: handlerConfig.inputParams,
      annotations: handlerConfig.annotations,
    },
    handlerConfig.tool(registeredWorkflowTools),
  );
}
