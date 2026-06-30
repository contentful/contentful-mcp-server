import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import {
  BaseToolSchema,
  createToolClient,
  assertEnvironmentNotProtected,
} from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const UnpublishDataAssemblyToolParams = BaseToolSchema.extend({
  dataAssemblyId: z.string().describe('The ID of the data assembly to unpublish'),
  version: z
    .number()
    .describe(
      "REQUIRED. The data assembly's sys.version as returned by get_data_assembly. " +
        'You must call get_data_assembly first to read the current state and version. ' +
        'The unpublish is rejected if this does not match the current version, which means ' +
        'the data assembly changed since you read it.',
    ),
});

type Params = z.infer<typeof UnpublishDataAssemblyToolParams>;

export function unpublishDataAssemblyTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      dataAssemblyId: args.dataAssemblyId,
    };

    const contentfulClient = createToolClient(config, args);

    // Read before write: the unpublish endpoint requires the current version.
    const current = await contentfulClient.dataAssembly.get(params);

    // Enforce read-before-write: reject if the caller's version is stale.
    if (args.version !== current.sys.version) {
      throw new Error(
        `Version conflict: the data assembly has changed since you read it ` +
          `(your version: ${args.version}, current version: ${current.sys.version}). ` +
          `Re-fetch the data assembly with get_data_assembly and retry with the latest sys.version.`,
      );
    }

    const dataAssembly = await contentfulClient.dataAssembly.unpublish({
      ...params,
      version: args.version,
    });

    return createSuccessResponse('Data assembly unpublished successfully', {
      dataAssembly,
    });
  }

  return withErrorHandling(tool, 'Error unpublishing data assembly');
}
