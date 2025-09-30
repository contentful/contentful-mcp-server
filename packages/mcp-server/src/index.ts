#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllPrompts } from './prompts/register.js';
import { registerAllResources } from './resources/register.js';
import {
  registerCreateAiActionTool,
  registerDeleteAiActionTool,
  registerGetAiActionInvocationTool,
  registerGetAiActionTool,
  registerInvokeAiActionTool,
  registerListAiActionsTool,
  registerPublishAiActionTool,
  registerUnpublishAiActionTool,
  registerUpdateAiActionTool,
} from './tools/ai-actions/register.js';
import { registerGetInitialContextTool } from './tools/context/register.js';
import {
  registerCreateContentTypeTool,
  registerDeleteContentTypeTool,
  registerGetContentTypeTool,
  registerListContentTypesTool,
  registerPublishContentTypeTool,
  registerUnpublishContentTypeTool,
  registerUpdateContentTypeTool,
} from './tools/content-types/register.js';
import {
  registerCreateEntryTool,
  registerDeleteEntryTool,
  registerGetEntryTool,
  registerPublishEntryTool,
  registerSearchEntriesTool,
  registerUnpublishEntryTool,
  registerUpdateEntryTool,
} from './tools/entries/register.js';
import {
  registerCreateEnvironmentTool,
  registerDeleteEnvironmentTool,
  registerListEnvironmentsTool,
} from './tools/environments/register.js';
import {
  registerDeleteLocaleTool,
  registerCreateLocaleTool,
  registerGetLocaleTool,
  registerListLocalesTool,
  registerUpdateLocaleTool,
} from './tools/locales/register.js';
import {
  registerCreateConceptSchemeTool,
  registerDeleteConceptSchemeTool,
  registerGetConceptSchemeTool,
  registerListConceptSchemesTool,
  registerUpdateConceptSchemeTool,
} from './tools/taxonomies/concept-schemes/register.js';
import {
  registerCreateTagTool,
  registerListTagsTool,
} from './tools/tags/register.js';
import {
  registerListOrgsTool,
  registerGetOrgTool,
} from './tools/orgs/register.js';
import {
  registerDeleteAssetTool,
  registerGetAssetTool,
  registerListAssetsTool,
  registerPublishAssetTool,
  registerUnpublishAssetTool,
  registerUpdateAssetTool,
  registerUploadAssetTool,
} from './tools/assets/register.js';
import {
  registerExportSpaceTool,
  registerImportSpaceTool,
  registerSpaceToSpaceMigrationHandlerTool,
  registerSpaceToSpaceParamCollectionTool,
} from './tools/jobs/space-to-space-migration/register.js';
import { VERSION } from './config/version.js';

if (process.env.NODE_ENV === 'development') {
  try {
    await import('mcps-logger/console');
  } catch {
    console.warn(
      'mcps-logger not available outside the development environment.',
    );
  }
}

const MCP_SERVER_NAME = '@contentful/mcp-server';

async function initializeServer() {
  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: VERSION,
  });

  registerGetInitialContextTool(server);

  registerCreateAiActionTool(server);
  registerInvokeAiActionTool(server);
  registerGetAiActionInvocationTool(server);
  registerDeleteAiActionTool(server);
  registerGetAiActionTool(server);
  registerListAiActionsTool(server);
  registerPublishAiActionTool(server);
  registerUnpublishAiActionTool(server);
  registerUpdateAiActionTool(server);

  registerCreateContentTypeTool(server);
  registerGetContentTypeTool(server);
  registerListContentTypesTool(server);
  registerUpdateContentTypeTool(server);
  registerDeleteContentTypeTool(server);
  registerPublishContentTypeTool(server);
  registerUnpublishContentTypeTool(server);

  registerSearchEntriesTool(server);
  registerCreateEntryTool(server);
  registerGetEntryTool(server);
  registerUpdateEntryTool(server);
  registerDeleteEntryTool(server);
  registerPublishEntryTool(server);
  registerUnpublishEntryTool(server);

  registerCreateEnvironmentTool(server);
  registerListEnvironmentsTool(server);
  registerDeleteEnvironmentTool(server);

  registerUploadAssetTool(server);
  registerListAssetsTool(server);
  registerGetAssetTool(server);
  registerUpdateAssetTool(server);
  registerDeleteAssetTool(server);
  registerPublishAssetTool(server);
  registerUnpublishAssetTool(server);

  registerCreateTagTool(server);
  registerListTagsTool(server);

  registerListOrgsTool(server);
  registerGetOrgTool(server);

  registerListLocalesTool(server);
  registerGetLocaleTool(server);
  registerCreateLocaleTool(server);
  registerUpdateLocaleTool(server);
  registerDeleteLocaleTool(server);

  registerCreateConceptSchemeTool(server);
  registerGetConceptSchemeTool(server);
  registerListConceptSchemesTool(server);
  registerUpdateConceptSchemeTool(server);
  registerDeleteConceptSchemeTool(server);

  registerSpaceToSpaceParamCollectionTool(server);
  registerExportSpaceTool(server);
  registerImportSpaceTool(server);
  registerSpaceToSpaceMigrationHandlerTool(server);

  registerAllPrompts(server);
  registerAllResources(server);

  return server;
}

async function main() {
  try {
    const server = await initializeServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
