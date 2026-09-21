import { mkdir, mkdtemp, realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  createSuccessResponse,
  formatErrorMessage,
  withErrorHandling,
} from '../../../utils/response.js';
import { createClientConfig } from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';
import { ExportParamsSchema, type ExportParams } from './types.js';

const EXPORT_FILE_NAME = 'contentful-export.json';
const EXPORT_ERROR_LOG_FILE_NAME = 'contentful-export-error.log';

async function createExportDirectory(baseDir: string | undefined) {
  const configuredBase = resolve(baseDir ?? process.cwd());

  await mkdir(configuredBase, { recursive: true });

  // Resolve the configured root before creating the per-export directory so a
  // symlinked base resolves to its canonical location. The generated child
  // directory is the only path passed to contentful-export.
  const canonicalBase = await realpath(configuredBase);
  return mkdtemp(join(canonicalBase, 'contentful-export-'));
}

export function createExportSpaceTool(config: ContentfulConfig) {
  async function tool(args: ExportParams) {
    // Get management token from the same config used by other MCP tools
    const clientConfig = createClientConfig(config);
    const managementToken = clientConfig.accessToken;

    if (!managementToken) {
      throw new Error('Contentful management token is not configured');
    }

    const safeOptions = ExportParamsSchema.parse({
      ...args,
      environmentId: args.environmentId || 'master',
    });
    const exportDir = await createExportDirectory(config.exportBaseDir);

    const exportOptions = {
      ...safeOptions,
      exportDir,
      contentFile: EXPORT_FILE_NAME,
      // contentful-export resolves a caller-provided errorLogFile relative to
      // process.cwd(). Pass an absolute, server-generated path instead.
      errorLogFile: join(exportDir, EXPORT_ERROR_LOG_FILE_NAME),
      managementToken,
      host: config.host ?? 'api.contentful.com',
      ...(config.deliveryToken && { deliveryToken: config.deliveryToken }),
      ...(config.hostDelivery && { hostDelivery: config.hostDelivery }),
    } as any;

    try {
      const contentfulExport = await import('contentful-export');

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore The runtime default export is callable even though the import is typed as a module namespace here.
      const result = await contentfulExport.default(exportOptions);

      const exportPath = join(exportDir, EXPORT_FILE_NAME);

      return createSuccessResponse('Space exported successfully', {
        spaceId: safeOptions.spaceId,
        environmentId: safeOptions.environmentId,
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
      throw new Error(`Failed to export space: ${formatErrorMessage(error)}`);
    }
  }

  return withErrorHandling(tool, 'Error exporting space');
}
