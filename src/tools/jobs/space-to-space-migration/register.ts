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
  const paramCollectionTool = server.tool(
    'space_to_space_param_collection',
    'Collect parameters for the space to space migration workflow. This tool should ALWAYS start with confirmation false, until the user confirms they are ready to proceed with the workflow. Do not assume they use wants to proceed with the workflow until they explicitly say so.',
    ParamCollectionToolParams.shape,
    createParamCollectionTool,
  );

  // Export space tool
  const exportSpaceTool = server.tool(
    'export_space',
    'Export a space to a file',
    ExportSpaceToolParams.shape,
    createExportSpaceTool,
  );

  // Import space tool
  const importSpaceTool = server.tool(
    'import_space',
    'Import a space from a file. Step 4 of the space to space migration workflow.',
    ImportSpaceToolParams.shape,
    createImportSpaceTool,
  );

  // Create the unified migration handler tool
  server.tool(
    'space_to_space_migration_handler',
    'Enable or disable the space to space migration workflow tools. Set enableWorkflow=true to start, false to conclude the workflow.',
    SpaceToSpaceMigrationHandlerToolParams.shape,
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
