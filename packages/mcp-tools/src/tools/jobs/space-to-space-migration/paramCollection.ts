import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema } from '../../../utils/tools.js';
import { ExportParamsSchema, ImportParamsSchema } from './types.js';

export const ParamCollectionToolParams = BaseToolSchema.extend({
  confirmation: z
    .boolean()
    .optional()
    .describe(
      'User confirmation that they are ready to proceed with the workflow',
    ),

  export: ExportParamsSchema.partial().optional(),
  import: ImportParamsSchema.partial().optional(),
});

type Params = z.infer<typeof ParamCollectionToolParams>;

const paramCollectionConfig = {
  export: {
    requiredParams: `
spaceId                 // [string] [required] - ID of the space with source data
    `,
    optionalParams: `
environmentId           // [string] [default: 'master'] - ID of the environment in the source space
exportDir               // [string] [default: process.cwd()] - Path to export JSON output
saveFile                // [boolean] [default: true] - Save the export as a JSON file
contentFile             // [string] - Filename for exported data

includeDrafts           // [boolean] [default: false] - Include drafts in exported entries
includeArchived         // [boolean] [default: false] - Include archived entries
skipContentModel        // [boolean] [default: false] - Skip exporting content models
skipEditorInterfaces    // [boolean] [default: false] - Skip exporting editor interfaces
skipContent             // [boolean] [default: false] - Skip exporting entries and assets
skipRoles               // [boolean] [default: false] - Skip exporting roles and permissions
skipTags                // [boolean] [default: false] - Skip exporting tags
skipWebhooks            // [boolean] [default: false] - Skip exporting webhooks
stripTags               // [boolean] [default: false] - Remove tags from entries and assets
contentOnly             // [boolean] [default: false] - Export only entries and assets

queryEntries            // [array] - Export only entries that match query parameters
queryAssets             // [array] - Export only assets that match query parameters
downloadAssets          // [boolean] - Download asset files to disk

maxAllowedLimit         // [number] [default: 1000] - Page size for requests

errorLogFile            // [string] - Path to error log output file
useVerboseRenderer      // [boolean] [default: false] - Line-by-line logging, useful for CI
    `,
  },
  import: {
    requiredParams: `
spaceId                 // [string] [required] - ID of the space to import into
    `,
    optionalParams: `
environmentId           // [string] [default: 'master'] - Target environment in destination space
contentFile             // [string] - Path to JSON file containing the content to import
content                 // [object] - JS object containing import content (must match expected structure)

contentModelOnly        // [boolean] [default: false] - Import only content types
skipContentModel        // [boolean] [default: false] - Skip importing content types and locales
skipLocales             // [boolean] [default: false] - Skip importing locales
skipContentUpdates      // [boolean] [default: false] - Do not update existing content
skipContentPublishing   // [boolean] [default: false] - Create but do not publish content

uploadAssets            // [boolean] [default: false] - Upload asset files (requires assetsDirectory)
skipAssetUpdates        // [boolean] [default: false] - Do not update existing assets
assetsDirectory         // [string] - Path to directory containing exported asset files
timeout                 // [number] [default: 3000] - Time between retries during asset processing (ms)
retryLimit              // [number] [default: 10] - Max retries for asset processing

rateLimit               // [number] [default: 7] - Max requests per second to the API

errorLogFile            // [string] - Path to error log file
useVerboseRenderer      // [boolean] [default: false] - Line-by-line progress output (good for CI)
    `,
  },
};

async function tool(args: Params) {
  const exportParams = args.export
    ? ExportParamsSchema.partial().parse(args.export)
    : {};

  const importParams = args.import
    ? ImportParamsSchema.partial().parse(args.import)
    : {};

  const params = {
    export: Object.keys(exportParams).length > 0 ? exportParams : undefined,
    import: Object.keys(importParams).length > 0 ? importParams : undefined,
  };

  // If user has confirmed, return ready-to-proceed response
  if (args.confirmation === true) {
    return createSuccessResponse('User ready to proceed with workflow', {
      message:
        'User has confirmed they are ready to proceed with the space-to-space migration workflow.',
      workflowParams: params,
      nextStep:
        'Proceed with the migration workflow using the collected parameters.',
    });
  }

  // Otherwise, return parameter collection response
  return createSuccessResponse('Param collection tool', {
    instructions: `
    Help the user collect the correct parameters for the space to space migration workflow.
    Call this tool repeatedly until the user feels they are ready to start the workflow.

    Help them understand the required and optional parameters for the export and import tools.
    Help them understand the instructions for the export and import tools.
    Help them understand the available params for the export and import tools, ensure you list at all the optional params not just the required ones.

    Continue to build the parameters passed into this tool until the user passes a confirmation that they are ready to start the workflow.
    `,
    availableParams: paramCollectionConfig,
    currentParams: params,
  });
}

export const createParamCollectionTool = withErrorHandling(
  tool,
  'Error creating param collection tool',
);
