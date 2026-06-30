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
  version: z
    .number()
    .describe(
      "REQUIRED. The component type's sys.version as returned by get_component_type. " +
        'You must call get_component_type first to read the current state and version. ' +
        'The unpublish is rejected if this does not match the current version, which means ' +
        'the component type changed since you read it.',
    ),
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

    // Enforce read-before-write: reject if the caller's version is stale.
    if (args.version !== current.sys.version) {
      throw new Error(
        `Version conflict: the component type has changed since you read it ` +
          `(your version: ${args.version}, current version: ${current.sys.version}). ` +
          `Re-fetch the component type with get_component_type and retry with the latest sys.version.`,
      );
    }

    const componentType = await contentfulClient.componentType.unpublish({
      ...params,
      version: args.version,
    });

    return createSuccessResponse('Component type unpublished successfully', {
      componentType,
    });
  }

  return withErrorHandling(tool, 'Error unpublishing component type');
}
