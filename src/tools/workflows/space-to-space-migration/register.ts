import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  makeSpaceToSpaceMigrationTool,
  StartSpaceToSpaceMigrationToolParams,
} from './startMigration.js';
import { exportSpaceTool, ExportSpaceToolParams } from './exportSpace.js';
import z from 'zod';
import {
  ParamCollectionToolParams,
  createParamCollectionTool,
} from './paramCollection.js';

export function registerSpaceToSpaceMigrationTools(server: McpServer) {
  // Placeholder param collection tool
  const paramCollectionTool = server.tool(
    'space_to_space_param_collection',
    'Collect parameters for the space to space migration workflow. This tool should ALWAYS start with confirmation false, until the user confirms they are ready to proceed with the workflow. Do not assume they use wants to proceed with the workflow until they explicitly say so.',
    ParamCollectionToolParams.shape,
    createParamCollectionTool,
  );

  // Export space tool
  const exportSpaceToolRegistered = server.tool(
    'export_space',
    'Export a space to a file',
    ExportSpaceToolParams.shape,
    exportSpaceTool,
  );

  // Placeholder import space tool
  const importSpaceTool = server.tool(
    'import_space',
    'Import a space from a file',
    z.object({}).shape,
    () => ({
      content: [
        {
          type: 'text',
          text: 'import tool',
        },
      ],
    }),
  );

  // Disable all tools except the start_space_to_space_migration tool by default
  paramCollectionTool.disable();
  importSpaceTool.disable();
  exportSpaceToolRegistered.disable();

  const StartSpaceToSpaceMigrationTool = makeSpaceToSpaceMigrationTool([
    paramCollectionTool,
    exportSpaceToolRegistered,
    importSpaceTool,
  ]);

  server.tool(
    'start_space_to_space_migration',
    'Confirmation if the user wants to start the space to space migration workflow',
    StartSpaceToSpaceMigrationToolParams.shape,
    StartSpaceToSpaceMigrationTool,
  );
}
