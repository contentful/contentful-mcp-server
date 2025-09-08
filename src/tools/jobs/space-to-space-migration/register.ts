import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  makeSpaceToSpaceMigrationTool,
  StartSpaceToSpaceMigrationToolParams,
} from './startMigration.js';
import { createExportSpaceTool, ExportSpaceToolParams } from './exportSpace.js';
import {
  ParamCollectionToolParams,
  createParamCollectionTool,
} from './paramCollection.js';
import { ImportSpaceToolParams, createImportSpaceTool } from './importSpace.js';
import {
  TeardownSpaceToSpaceMigrationToolParams,
  makeSpaceToSpaceTeardownTool,
} from './teardownMigration.js';

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

  const TeardownSpaceToSpaceMigrationTool = makeSpaceToSpaceTeardownTool([
    paramCollectionTool,
    exportSpaceTool,
    importSpaceTool,
  ]);

  const teardownTool = server.tool(
    's2s_teardown',
    'Conclude the space to space migration workflow and disable all related tools',
    TeardownSpaceToSpaceMigrationToolParams.shape,
    TeardownSpaceToSpaceMigrationTool,
  );

  // Disable all tools except the start_space_to_space_migration tool by default
  paramCollectionTool.disable();
  importSpaceTool.disable();
  exportSpaceTool.disable();
  teardownTool.disable();

  const StartSpaceToSpaceMigrationTool = makeSpaceToSpaceMigrationTool([
    paramCollectionTool,
    exportSpaceTool,
    importSpaceTool,
    teardownTool,
  ]);

  server.tool(
    'start_space_to_space_migration',
    'Confirmation if the user wants to start the space to space migration workflow',
    StartSpaceToSpaceMigrationToolParams.shape,
    StartSpaceToSpaceMigrationTool,
  );
}
