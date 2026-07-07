import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ContentfulMcpTools, detectExoDisposition } from '@contentful/mcp-tools';
import { env } from '../config/env.js';
import { getVersion } from '../getVersion.js';

/**
 * Registers all Contentful MCP tools with the server.
 * Each tool is registered with its title, description, input schema, annotations, and implementation.
 *
 * ExO (Experience Orchestration) tool collections are gated on the configured space's
 * disposition:
 * - No SPACE_ID: nothing to probe, register everything (ExO included).
 * - SPACE_ID set: probe once via detectExoDisposition. 'exo'/'empty' -> register ExO
 *   collections. 'classic' or a probe error (undefined) -> omit ExO collections
 *   (fail closed).
 *
 * Special handling for space-to-space migration workflow tools:
 * - The param collection, export, and import tools are disabled by default
 * - The migration handler controls their enable/disable state
 */
export async function registerAllTools(server: McpServer): Promise<void> {
  if (!env.success || !env.data) {
    throw new Error('Environment variables are not properly configured');
  }

  // Parse protectedEnvironments: collapse empty arrays (e.g. ", ,") to undefined
  // so that undefined consistently means "feature disabled"
  const parsedProtectedEnvs = env.data.PROTECTED_ENVIRONMENTS
    ? env.data.PROTECTED_ENVIRONMENTS.split(',')
        .map((e) => e.trim())
        .filter(Boolean)
    : undefined;
  const protectedEnvironments = parsedProtectedEnvs?.length
    ? parsedProtectedEnvs
    : undefined;

  const maxBulkSize = env.data.MAX_BULK_SIZE
    ? Number(env.data.MAX_BULK_SIZE)
    : undefined;

  // Base config used both for detection and for the tools instance.
  const baseConfig = {
    accessToken: env.data.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN,
    host: env.data.CONTENTFUL_HOST,
    spaceId: env.data.SPACE_ID,
    environmentId: env.data.ENVIRONMENT_ID,
    organizationId: env.data.ORGANIZATION_ID,
    appId: env.data.APP_ID,
    mcpVersion: getVersion(),
    deliveryToken: env.data.CONTENTFUL_DELIVERY_TOKEN,
    hostDelivery: env.data.CONTENTFUL_DELIVERY_HOST,
    protectedEnvironments,
    maxBulkSize,
  };

  // Decide whether to register ExO collections.
  // - No SPACE_ID: nothing to probe, user hasn't scoped to a space -> full toolset.
  // - SPACE_ID set: probe once; register ExO only when empty or already ExO.
  //   Fail closed (classic-only) on 'classic' or a detection error (undefined).
  let registerExoTools = true;
  if (baseConfig.spaceId) {
    const disposition = await detectExoDisposition(
      baseConfig,
      baseConfig.spaceId,
      baseConfig.environmentId ?? 'master',
    );
    registerExoTools = disposition === 'exo' || disposition === 'empty';
  }

  // Initialize tools with configuration from environment variables
  const tools = new ContentfulMcpTools({
    ...baseConfig,
    exoToolsRegistered: registerExoTools,
  });

  // Classic (always-registered) tool collections
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

  // Combine standard tool collections with the ExO collections, gated on detection.
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
    ...(registerExoTools
      ? [
          tools.getComponentTypeTools(),
          tools.getDataAssemblyTools(),
          tools.getExperienceTools(),
          tools.getTemplateTools(),
          tools.getFragmentTools(),
        ]
      : []),
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
