import {
  createSuccessResponse,
  formatErrorMessage,
  withErrorHandling,
} from '../../../utils/response.js';
import { createClientConfig } from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';
import { ExportParamsSchema, type ExportParams } from './types.js';
import { createExportArtifact, type ExportArtifact } from './exportArtifact.js';
import { downloadAssetsSafely } from './assetDownloads.js';

export type ExportArtifactFactory = () => Promise<ExportArtifact>;

export function createExportSpaceTool(
  config: ContentfulConfig,
  createArtifact: ExportArtifactFactory = createExportArtifact,
) {
  async function tool(args: ExportParams) {
    // Get management token from the same config used by other MCP tools
    const clientConfig = createClientConfig(config);
    const managementToken = clientConfig.accessToken;

    if (!managementToken) {
      throw new Error('Contentful management token is not configured');
    }

    const artifact = await createArtifact();

    const safeOptions = ExportParamsSchema.parse({
      ...args,
      environmentId: args.environmentId || 'master',
    });

    const exportOptions = {
      ...safeOptions,
      downloadAssets: false,
      managementToken,
      host: config.host ?? 'api.contentful.com',
      ...(config.deliveryToken && { deliveryToken: config.deliveryToken }),
      ...(config.hostDelivery && { hostDelivery: config.hostDelivery }),
      exportDir: artifact.exportDir,
      contentFile: artifact.contentFile,
      errorLogFile: artifact.errorLogFile,
    } as any;

    try {
      const contentfulExport = await import('contentful-export');

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore The runtime default export is callable even though the import is typed as a module namespace here.
      const result = await contentfulExport.default(exportOptions);

      if (args.downloadAssets && result.assets) {
        await downloadAssetsSafely(exportOptions, result.assets);
      }

      return createSuccessResponse('Space exported successfully', {
        spaceId: args.spaceId,
        environmentId: args.environmentId || 'master',
        exportPath: artifact.exportPath,
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
