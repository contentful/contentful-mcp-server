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

export const UnpublishComponentToolParams = BaseToolSchema.extend({
  componentId: z.string().describe('The ID of the component to unpublish'),
  version: z
    .number()
    .describe(
      "REQUIRED. The component's sys.version as returned by get_component. " +
        'You must call get_component first to read the current state and version. ' +
        'The unpublish is rejected if this does not match the current version, which means ' +
        'the component changed since you read it.',
    ),
});

type Params = z.infer<typeof UnpublishComponentToolParams>;

export function unpublishComponentTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      componentId: args.componentId,
    };

    const contentfulClient = createToolClient(config, args);

    // Read before write: the unpublish endpoint requires the current version.
    const current = await contentfulClient.component.get(params);

    // Enforce read-before-write: reject if the caller's version is stale.
    if (args.version !== current.sys.version) {
      throw new Error(
        `Version conflict: the component has changed since you read it ` +
          `(your version: ${args.version}, current version: ${current.sys.version}). ` +
          `Re-fetch the component with get_component and retry with the latest sys.version.`,
      );
    }

    const component = await contentfulClient.component.unpublish({
      ...params,
      version: args.version,
    });

    return createSuccessResponse('Component unpublished successfully', {
      component,
    });
  }

  return withErrorHandling(tool, 'Error unpublishing component');
}
