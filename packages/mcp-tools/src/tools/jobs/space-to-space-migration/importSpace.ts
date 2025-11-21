import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createClientConfig } from '../../../utils/tools.js';
import { createRequire } from 'module';
import type { ContentfulConfig } from '../../../config/types.js';

const require = createRequire(import.meta.url);
const contentfulImport = require('contentful-import');

export const ImportSpaceToolParams = BaseToolSchema.extend({
  contentFile: z
    .string()
    .optional()
    .describe('Path to JSON file containing the content to import'),
  content: z
    .record(z.any())
    .optional()
    .describe(
      'JS object containing import content (must match expected structure)',
    ),
  contentModelOnly: z
    .boolean()
    .optional()
    .default(false)
    .describe('Import only content types'),
  skipContentModel: z
    .boolean()
    .optional()
    .default(false)
    .describe('Skip importing content types and locales'),
  skipLocales: z
    .boolean()
    .optional()
    .default(false)
    .describe('Skip importing locales'),
  skipContentUpdates: z
    .boolean()
    .optional()
    .default(false)
    .describe('Do not update existing content'),
  skipContentPublishing: z
    .boolean()
    .optional()
    .default(false)
    .describe('Create but do not publish content'),
  uploadAssets: z
    .boolean()
    .optional()
    .default(false)
    .describe('Upload asset files (requires assetsDirectory)'),
  skipAssetUpdates: z
    .boolean()
    .optional()
    .default(false)
    .describe('Do not update existing assets'),
  assetsDirectory: z
    .string()
    .optional()
    .describe('Path to directory containing exported asset files'),
  timeout: z
    .number()
    .optional()
    .default(3000)
    .describe('Time between retries during asset processing (ms)'),
  retryLimit: z
    .number()
    .optional()
    .default(10)
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
    .default(7)
    .describe('Max requests per second to the API'),
  headers: z
    .record(z.any())
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
});

type Params = z.infer<typeof ImportSpaceToolParams>;

export function createImportSpaceTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    // Get management token from the same config used by other MCP tools
    const clientConfig = createClientConfig(config);
    const managementToken = clientConfig.accessToken;

  if (!managementToken) {
    throw new Error('Contentful management token is not configured');
  }

  // Consolidate args with defaults and additional required fields
  const importOptions = {
    ...args,
    managementToken,
    environmentId: args.environmentId || 'master',
  };

  try {
    const result = await contentfulImport(importOptions);

    return createSuccessResponse('Space imported successfully', {
      spaceId: args.spaceId,
      environmentId: args.environmentId || 'master',
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
      `Failed to import space: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  }

  return withErrorHandling(tool, 'Error importing space');
}
