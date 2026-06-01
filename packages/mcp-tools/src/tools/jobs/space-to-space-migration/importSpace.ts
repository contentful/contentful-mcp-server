import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createClientConfig } from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';

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
  rateLimit: z
    .number()
    .optional()
    .default(7)
    .describe('Max requests per second to the API'),
  errorLogFile: z.string().optional().describe('Path to error log file'),
  useVerboseRenderer: z
    .boolean()
    .optional()
    .describe('Line-by-line progress output (good for CI)'),
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

    // host is always sourced from server config — never from LLM-controlled args.
    // Zod strips unknown fields before this point, so ...args only contains
    // schema-declared fields.
    const importOptions = {
      ...args,
      managementToken,
      host: config.host ?? 'api.contentful.com',
      environmentId: args.environmentId || 'master',
    } as any;

    try {
      const contentfulImport = await import('contentful-import');
      const result = await contentfulImport.default(importOptions);

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
