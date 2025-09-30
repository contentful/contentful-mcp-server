import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createExportSpaceTool, ExportSpaceToolParams } from './exportSpace.js';
import {
  ParamCollectionToolParams,
  createParamCollectionTool,
} from './paramCollection.js';
import { ImportSpaceToolParams, createImportSpaceTool } from './importSpace.js';
import {
  SpaceToSpaceMigrationHandlerToolParams,
  makeSpaceToSpaceMigrationHandlerTool,
} from './migrationHandler.js';

export function registerSpaceToSpaceMigrationTools(server: McpServer) {
  // Param collection tool
  const paramCollectionTool = server.registerTool(
    'space_to_space_param_collection',
    {
      description:
        'Collect parameters for the space to space migration workflow. This tool should ALWAYS start with confirmation false, until the user confirms they are ready to proceed with the workflow. Do not assume they use wants to proceed with the workflow until they explicitly say so.',
      inputSchema: ParamCollectionToolParams.shape,
    },
    createParamCollectionTool,
  );

  // Export space tool
  const exportSpaceTool = server.registerTool(
    'export_space',
    {
      description: 'Export a space to a file',
      inputSchema: ExportSpaceToolParams.shape,
    },
    createExportSpaceTool,
  );

  // Import space tool
  const importSpaceTool = server.registerTool(
    'import_space',
    {
      description:
        'Import a space from a file. Step 4 of the space to space migration workflow.',
      inputSchema: ImportSpaceToolParams.shape,
    },
    createImportSpaceTool,
  );

  // Create the unified migration handler tool
  server.registerTool(
    'space_to_space_migration_handler',
    {
      description:
        'Enable or disable the space to space migration workflow tools. Set enableWorkflow=true to start, false to conclude the workflow.',
      inputSchema: SpaceToSpaceMigrationHandlerToolParams.shape,
    },
    makeSpaceToSpaceMigrationHandlerTool([
      paramCollectionTool,
      exportSpaceTool,
      importSpaceTool,
    ]),
  );

  // Disable all workflow tools by default (only the handler remains enabled)
  paramCollectionTool.disable();
  importSpaceTool.disable();
  exportSpaceTool.disable();
}
