import {
  createSuccessResponse,
  formatErrorMessage,
  withErrorHandling,
} from '../../../utils/response.js';
import { createClientConfig } from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';
import { ExportParamsSchema, type ExportParams } from './types.js';

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
      exportDir: args.exportDir || process.cwd(),
      contentFile: args.contentFile || `contentful-export-${args.spaceId}.json`,
    });

    const exportOptions = {
      ...safeOptions,
      managementToken,
      host: config.host ?? 'api.contentful.com',
      ...(config.deliveryToken && { deliveryToken: config.deliveryToken }),
      ...(config.hostDelivery && { hostDelivery: config.hostDelivery }),
    } as any;

    try {
      const contentfulExport = await import('contentful-export');
      const path = await import('path');

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore The runtime default export is callable even though the import is typed as a module namespace here.
      const result = await contentfulExport.default(exportOptions);

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
      throw new Error(`Failed to export space: ${formatErrorMessage(error)}`);
    }
  }

  return withErrorHandling(tool, 'Error exporting space');
}
