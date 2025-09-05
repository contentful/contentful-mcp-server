import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema } from '../../../utils/tools.js';
import {
  EntryQuerySchema,
  AssetQuerySchema,
} from '../../../types/querySchema.js';

export const ParamCollectionToolParams = BaseToolSchema.extend({
  confirmation: z
    .boolean()
    .optional()
    .describe(
      'User confirmation that they are ready to proceed with the workflow',
    ),

  export: z
    .object({
      spaceId: z
        .string()
        .optional()
        .describe('ID of the space with source data'),
      environmentId: z
        .string()
        .optional()
        .describe('ID of the environment in the source space'),
      deliveryToken: z
        .string()
        .optional()
        .describe('CDA token to export only published content (excludes tags)'),

      exportDir: z.string().optional().describe('Path to export JSON output'),
      saveFile: z
        .boolean()
        .optional()
        .describe('Save the export as a JSON file'),
      contentFile: z.string().optional().describe('Filename for exported data'),

      includeDrafts: z
        .boolean()
        .optional()
        .describe('Include drafts in exported entries'),
      includeArchived: z
        .boolean()
        .optional()
        .describe('Include archived entries'),
      skipContentModel: z
        .boolean()
        .optional()
        .describe('Skip exporting content models'),
      skipEditorInterfaces: z
        .boolean()
        .optional()
        .describe('Skip exporting editor interfaces'),
      skipContent: z
        .boolean()
        .optional()
        .describe('Skip exporting entries and assets'),
      skipRoles: z
        .boolean()
        .optional()
        .describe('Skip exporting roles and permissions'),
      skipTags: z.boolean().optional().describe('Skip exporting tags'),
      skipWebhooks: z.boolean().optional().describe('Skip exporting webhooks'),
      stripTags: z
        .boolean()
        .optional()
        .describe('Remove tags from entries and assets'),
      contentOnly: z
        .boolean()
        .optional()
        .describe('Export only entries and assets'),

      queryEntries: EntryQuerySchema.optional().describe(
        'Export only entries that match query parameters',
      ),
      queryAssets: AssetQuerySchema.optional().describe(
        'Export only assets that match query parameters',
      ),
      downloadAssets: z
        .boolean()
        .optional()
        .describe('Download asset files to disk'),

      host: z.string().optional().describe('Management API host'),
      hostDelivery: z.string().optional().describe('Delivery API host'),
      proxy: z.string().optional().describe('HTTP/HTTPS proxy config'),
      rawProxy: z
        .boolean()
        .optional()
        .describe('Pass raw proxy config directly to Axios'),
      maxAllowedLimit: z.number().optional().describe('Page size for requests'),
      headers: z
        .record(z.string())
        .optional()
        .describe('Additional headers to include in requests'),

      errorLogFile: z
        .string()
        .optional()
        .describe('Path to error log output file'),
      useVerboseRenderer: z
        .boolean()
        .optional()
        .describe('Line-by-line logging, useful for CI'),
      config: z
        .string()
        .optional()
        .describe('Path to a JSON config file with all options'),
    })
    .optional(),

  import: z
    .object({
      spaceId: z.string().optional().describe('ID of the space to import into'),
      environmentId: z
        .string()
        .optional()
        .describe('Target environment in destination space'),
      contentFile: z
        .string()
        .optional()
        .describe('Path to JSON file containing the content to import'),
      content: z
        .record(z.unknown())
        .optional()
        .describe(
          'JS object containing import content (must match expected structure)',
        ),

      contentModelOnly: z
        .boolean()
        .optional()
        .describe('Import only content types'),
      skipContentModel: z
        .boolean()
        .optional()
        .describe('Skip importing content types and locales'),
      skipLocales: z.boolean().optional().describe('Skip importing locales'),
      skipContentUpdates: z
        .boolean()
        .optional()
        .describe('Do not update existing content'),
      skipContentPublishing: z
        .boolean()
        .optional()
        .describe('Create but do not publish content'),

      uploadAssets: z
        .boolean()
        .optional()
        .describe('Upload asset files (requires assetsDirectory)'),
      skipAssetUpdates: z
        .boolean()
        .optional()
        .describe('Do not update existing assets'),
      assetsDirectory: z
        .string()
        .optional()
        .describe('Path to directory containing exported asset files'),
      timeout: z
        .number()
        .optional()
        .describe('Time between retries during asset processing (ms)'),
      retryLimit: z
        .number()
        .optional()
        .describe('Max retries for asset processing'),

      host: z.string().optional().describe('Management API host'),
      proxy: z
        .string()
        .optional()
        .describe('HTTP/HTTPS proxy string (host:port or user:pass@host:port)'),
      rawProxy: z
        .boolean()
        .optional()
        .describe('Pass proxy config directly to Axios'),
      rateLimit: z
        .number()
        .optional()
        .describe('Max requests per second to the API'),
      headers: z
        .record(z.string())
        .optional()
        .describe('Additional headers to attach to requests'),

      errorLogFile: z.string().optional().describe('Path to error log file'),
      useVerboseRenderer: z
        .boolean()
        .optional()
        .describe('Line-by-line progress output (good for CI)'),
      config: z
        .string()
        .optional()
        .describe('Path to config JSON file (merged with CLI args)'),
    })
    .optional(),
});

type Params = z.infer<typeof ParamCollectionToolParams>;

const paramCollectionConfig = {
  export: {
    requiredParams: `
spaceId                 // [string] [required] - ID of the space with source data
    `,
    optionalParams: `
environmentId           // [string] [default: 'master'] - ID of the environment in the source space
deliveryToken           // [string] - CDA token to export only published content (excludes tags)

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

host                    // [string] [default: 'api.contentful.com'] - Management API host
hostDelivery            // [string] [default: 'cdn.contentful.com'] - Delivery API host
proxy                   // [string] - HTTP/HTTPS proxy config
rawProxy                // [boolean] - Pass raw proxy config directly to Axios
maxAllowedLimit         // [number] [default: 1000] - Page size for requests
headers                 // [object] - Additional headers to include in requests

errorLogFile            // [string] - Path to error log output file
useVerboseRenderer      // [boolean] [default: false] - Line-by-line logging, useful for CI
config                  // [string] - Path to a JSON config file with all options
    `,
  },
  import: {
    requiredParams: `
spaceId                 // [string] [required] - ID of the space to import into
managementToken         // [string] [required] - Contentful Management API token
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

host                    // [string] [default: 'api.contentful.com'] - Management API host
proxy                   // [string] - HTTP/HTTPS proxy string (host:port or user:pass@host:port)
rawProxy                // [boolean] - Pass proxy config directly to Axios
rateLimit               // [number] [default: 7] - Max requests per second to the API
headers                 // [object] - Additional headers to attach to requests

errorLogFile            // [string] - Path to error log file
useVerboseRenderer      // [boolean] [default: false] - Line-by-line progress output (good for CI)
config                  // [string] - Path to config JSON file (merged with CLI args)
    `,
  },
};

async function tool(args: Params) {
  // Extract export and import parameters, filtering out undefined values
  const exportParams = args.export
    ? Object.fromEntries(
        Object.entries(args.export).filter(([, value]) => value !== undefined),
      )
    : {};

  const importParams = args.import
    ? Object.fromEntries(
        Object.entries(args.import).filter(([, value]) => value !== undefined),
      )
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
