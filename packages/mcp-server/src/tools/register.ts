import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ContentfulMcpTools } from '@contentful/mcp-tools';
import { env } from '../config/env.js';
import { getVersion } from '../getVersion.js';

/**
 * Registers all Contentful MCP tools with the server.
 * Each tool is registered with its title, description, input schema, annotations, and implementation.
 *
 * Special handling for space-to-space migration workflow tools:
 * - The param collection, export, and import tools are disabled by default
 * - The migration handler controls their enable/disable state
 */
export function registerAllTools(server: McpServer): void {
  if (!env.success || !env.data) {
    throw new Error('Environment variables are not properly configured');
  }

  // Initialize tools with configuration from environment variables
  const tools = new ContentfulMcpTools({
    accessToken: env.data.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN,
    host: env.data.CONTENTFUL_HOST,
    spaceId: env.data.SPACE_ID,
    environmentId: env.data.ENVIRONMENT_ID,
    organizationId: env.data.ORGANIZATION_ID,
    appId: env.data.APP_ID,
    mcpVersion: getVersion(),
  });

  // Get tool collections
  const aiActionTools = tools.getAiActionTools();
  const assetTools = tools.getAssetTools();
  const contentTypeTools = tools.getContentTypeTools();
  const contextTools = tools.getContextTools();
  const editorInterfaceTools = tools.getEditorInterfaceTools();
  const entryTools = tools.getEntryTools();
  const environmentTools = tools.getEnvironmentTools();
  const localeTools = tools.getLocaleTools();
  const orgTools = tools.getOrgTools();
  const spaceTools = tools.getSpaceTools();
  const tagTools = tools.getTagTools();
  const taxonomyTools = tools.getTaxonomyTools();

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
  const jobTools = tools.getJobTools();
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
