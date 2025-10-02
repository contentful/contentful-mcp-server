import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  aiActionTools,
  assetTools,
  contentTypeTools,
  contextTools,
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
 */
export function registerAllTools(server: McpServer): void {
  // Combine all tool collections
  const allToolCollections = [
    aiActionTools,
    assetTools,
    contentTypeTools,
    contextTools,
    entryTools,
    environmentTools,
    jobTools,
    localeTools,
    orgTools,
    spaceTools,
    tagTools,
    taxonomyTools,
  ];

  // Register each tool from all collections
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
}
