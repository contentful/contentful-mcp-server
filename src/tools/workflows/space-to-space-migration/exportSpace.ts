import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema } from '../../../utils/tools.js';
import { getDefaultClientConfig } from '../../../config/contentful.js';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const contentfulExport = require('contentful-export');

export const ExportSpaceToolParams = BaseToolSchema.extend({
  exportDir: z
    .string()
    .optional()
    .describe(
      'Directory to save the exported space data (optional, defaults to current directory)',
    ),
  saveFile: z
    .boolean()
    .optional()
    .default(true)
    .describe('Save the exported space data to a file'),
  contentFile: z
    .string()
    .optional()
    .describe('Custom filename for the exported space data (optional)'),
  includeDrafts: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include draft entries in the export'),
  includeArchived: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include archived entries in the export'),
  skipContentModel: z
    .boolean()
    .optional()
    .default(false)
    .describe('Skip exporting content types'),
  skipEditorInterfaces: z
    .boolean()
    .optional()
    .default(false)
    .describe('Skip exporting editor interfaces'),
  skipContent: z
    .boolean()
    .optional()
    .default(false)
    .describe('Skip exporting entries and assets'),
  skipRoles: z
    .boolean()
    .optional()
    .default(false)
    .describe('Skip exporting roles and permissions'),
  skipTags: z
    .boolean()
    .optional()
    .default(false)
    .describe('Skip exporting tags'),
  skipWebhooks: z
    .boolean()
    .optional()
    .default(false)
    .describe('Skip exporting webhooks'),
  stripTags: z
    .boolean()
    .optional()
    .default(false)
    .describe('Untag assets and entries'),
  contentOnly: z
    .boolean()
    .optional()
    .default(false)
    .describe('Only export assets and entries'),
  queryEntries: z
    .array(z.string())
    .optional()
    .describe('Only export entries that match the query'),
  queryAssets: z
    .array(z.string())
    .optional()
    .describe('Only export assets that match the query'),
  downloadAssets: z
    .boolean()
    .optional()
    .default(false)
    .describe('Download actual asset files'),
  maxAllowedLimit: z
    .number()
    .optional()
    .default(1000)
    .describe('Maximum number of items per request'),
  deliveryToken: z
    .string()
    .optional()
    .describe('CDA token to export only published content (excludes tags)'),
  host: z.string().optional().describe('Management API host'),
  hostDelivery: z.string().optional().describe('Delivery API host'),
  proxy: z.string().optional().describe('HTTP/HTTPS proxy config'),
  rawProxy: z
    .boolean()
    .optional()
    .describe('Pass raw proxy config directly to Axios'),
  headers: z
    .record(z.any())
    .optional()
    .describe('Additional headers to include in requests'),
  errorLogFile: z.string().optional().describe('Path to error log output file'),
  useVerboseRenderer: z
    .boolean()
    .optional()
    .describe('Line-by-line logging, useful for CI'),
  config: z
    .string()
    .optional()
    .describe('Path to a JSON config file with all options'),
});

type Params = z.infer<typeof ExportSpaceToolParams>;

async function tool(args: Params) {
  // Get management token from the same config used by other MCP tools
  const clientConfig = getDefaultClientConfig();
  const managementToken = clientConfig.accessToken;

  if (!managementToken) {
    throw new Error('Contentful management token is not configured');
  }

  // Consolidate args with defaults and additional required fields
  const exportOptions = {
    ...args,
    managementToken,
    environmentId: args.environmentId || 'master',
    exportDir: args.exportDir || process.cwd(),
    contentFile: args.contentFile || `contentful-export-${args.spaceId}.json`,
  };

  try {
    const result = await contentfulExport(exportOptions);

    const exportPath = path.join(
      exportOptions.exportDir,
      exportOptions.contentFile,
    );

    return createSuccessResponse('Space exported successfully', {
      spaceId: args.spaceId,
      environmentId: args.environmentId || 'master',
      exportPath,
      contentTypes: result.contentTypes?.length || 0,
      entries: result.entries?.length || 0,
      assets: result.assets?.length || 0,
      locales: result.locales?.length || 0,
      tags: result.tags?.length || 0,
      webhooks: result.webhooks?.length || 0,
      roles: result.roles?.length || 0,
      editorInterfaces: result.editorInterfaces?.length || 0,
    });
  } catch (error) {
    throw new Error(
      `Failed to export space: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export const exportSpaceTool = withErrorHandling(tool, 'Error exporting space');
