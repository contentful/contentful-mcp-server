import {
  createSuccessResponse,
  formatErrorMessage,
  withErrorHandling,
} from '../../../utils/response.js';
import {
  createClientConfig,
  assertEnvironmentNotProtected,
} from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';
import { ImportParamsSchema, type ImportParams } from './types.js';

export function createImportSpaceTool(config: ContentfulConfig) {
  async function tool(args: ImportParams) {
    const targetEnvironmentId = args.environmentId || 'master';
    assertEnvironmentNotProtected(
      targetEnvironmentId,
      config.protectedEnvironments,
    );

    // Get management token from the same config used by other MCP tools
    const clientConfig = createClientConfig(config);
    const managementToken = clientConfig.accessToken;

    if (!managementToken) {
      throw new Error('Contentful management token is not configured');
    }

    const safeOptions = ImportParamsSchema.parse({
      ...args,
      environmentId: targetEnvironmentId,
    });

    const importOptions = {
      ...safeOptions,
      managementToken,
      host: config.host ?? 'api.contentful.com',
    } as any;

    try {
      const contentfulImport = await import('contentful-import');
      const result = await contentfulImport.default(importOptions);

      return createSuccessResponse('Space imported successfully', {
        spaceId: args.spaceId,
        environmentId: targetEnvironmentId,
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
      throw new Error(`Failed to import space: ${formatErrorMessage(error)}`);
    }
  }

  return withErrorHandling(tool, 'Error importing space');
}
