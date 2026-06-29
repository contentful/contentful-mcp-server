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

export const UnpublishComponentTypeToolParams = BaseToolSchema.extend({
  componentTypeId: z
    .string()
    .describe('The ID of the component type to unpublish'),
});

type Params = z.infer<typeof UnpublishComponentTypeToolParams>;

export function unpublishComponentTypeTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      componentTypeId: args.componentTypeId,
    };

    const contentfulClient = createToolClient(config, args);

    // Read before write: the unpublish endpoint requires the current version.
    const current = await contentfulClient.componentType.get(params);

    const componentType = await contentfulClient.componentType.unpublish({
      ...params,
      version: current.sys.version,
    });

    return createSuccessResponse('Component type unpublished successfully', {
      componentType,
    });
  }

  return withErrorHandling(tool, 'Error unpublishing component type');
}
