import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  makeSpaceToSpaceMigrationTool,
  StartSpaceToSpaceMigrationToolParams,
} from './startMigration.js';
import z from 'zod';

export function registerSpaceToSpaceMigrationTools(server: McpServer) {
  // Placeholder param collection tool
  const paramCollectionTool = server.tool(
    'space_to_space_param_collection',
    'Collect parameters for the space to space migration workflow',
    z.object({}).shape,
    () => ({
      content: [
        {
          type: 'text',
          text: 'param collection tool',
        },
      ],
    }),
  );

  // Placeholder export space tool
  const exportSpaceTool = server.tool(
    'export_space',
    'Export a space to a file',
    z.object({}).shape,
    () => ({
      content: [
        {
          type: 'text',
          text: 'export tool',
        },
      ],
    }),
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
  exportSpaceTool.disable();

  const StartSpaceToSpaceMigrationTool = makeSpaceToSpaceMigrationTool([
    paramCollectionTool,
    exportSpaceTool,
    importSpaceTool,
  ]);

  server.tool(
    'start_space_to_space_migration',
    'Confirmation if the user wants to start the space to space migration workflow',
    StartSpaceToSpaceMigrationToolParams.shape,
    StartSpaceToSpaceMigrationTool,
  );
}
