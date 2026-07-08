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

export const UnpublishFragmentToolParams = BaseToolSchema.extend({
  fragmentId: z.string().describe('The ID of the fragment to unpublish'),
  version: z
    .number()
    .describe(
      "REQUIRED. The fragment's sys.version as returned by get_fragment. " +
        'You must call get_fragment first to read the current state and version. ' +
        'The unpublish is rejected if this does not match the current version, which means ' +
        'the fragment changed since you read it.',
    ),
});

type Params = z.infer<typeof UnpublishFragmentToolParams>;

export function unpublishFragmentTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      fragmentId: args.fragmentId,
    };

    const contentfulClient = createToolClient(config, args);

    // Read before write: the unpublish endpoint requires the current version.
    const current = await contentfulClient.fragment.get(params);

    // Enforce read-before-write: reject if the caller's version is stale.
    if (args.version !== current.sys.version) {
      throw new Error(
        `Version conflict: the fragment has changed since you read it ` +
          `(your version: ${args.version}, current version: ${current.sys.version}). ` +
          `Re-fetch the fragment with get_fragment and retry with the latest sys.version.`,
      );
    }

    const fragment = await contentfulClient.fragment.unpublish({
      ...params,
      version: args.version,
    });

    return createSuccessResponse('Fragment unpublished successfully', {
      fragment,
    });
  }

  return withErrorHandling(tool, 'Error unpublishing fragment');
}
