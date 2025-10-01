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

export const jobTools = {
  spaceToSpaceParamCollection: {
    title: 'space_to_space_param_collection',
    description:
      'Collect parameters for the space to space migration workflow. This tool should ALWAYS start with confirmation false, until the user confirms they are ready to proceed with the workflow. Do not assume they use wants to proceed with the workflow until they explicitly say so.',
    inputParams: ParamCollectionToolParams.shape,
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
    tool: createParamCollectionTool,
  },
  exportSpace: {
    title: 'export_space',
    description: 'Export a space to a file',
    inputParams: ExportSpaceToolParams.shape,
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
    tool: createExportSpaceTool,
  },
  importSpace: {
    title: 'import_space',
    description:
      'Import a space from a file. Step 4 of the space to space migration workflow.',
    inputParams: ImportSpaceToolParams.shape,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    tool: createImportSpaceTool,
  },
  spaceToSpaceMigrationHandler: {
    title: 'space_to_space_migration_handler',
    description:
      'Enable or disable the space to space migration workflow tools. Set enableWorkflow=true to start, false to conclude the workflow.',
    inputParams: SpaceToSpaceMigrationHandlerToolParams.shape,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    tool: makeSpaceToSpaceMigrationHandlerTool,
  },
};
