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

export const PublishComponentTypeToolParams = BaseToolSchema.extend({
  componentTypeId: z
    .string()
    .describe('The ID of the component type to publish'),
});

type Params = z.infer<typeof PublishComponentTypeToolParams>;

export function publishComponentTypeTool(config: ContentfulConfig) {
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

    // Read before write: the publish endpoint requires the current version.
    const current = await contentfulClient.componentType.get(params);

    const componentType = await contentfulClient.componentType.publish({
      ...params,
      version: current.sys.version,
    });

    return createSuccessResponse('Component type published successfully', {
      componentType,
    });
  }

  return withErrorHandling(tool, 'Error publishing component type');
}
