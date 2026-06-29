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
import {
  buildConfirmToken,
  buildConfirmationPreview,
  CONFIRMATION_MESSAGE_PREFIX,
} from '../../../utils/confirmation.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const DeleteComponentTypeToolParams = BaseToolSchema.extend({
  componentTypeId: z
    .string()
    .describe('The ID of the component type to delete'),
  confirm: z
    .boolean()
    .optional()
    .describe(
      'Set to true on the second call to actually perform the deletion. Required together with confirmToken.',
    ),
  confirmToken: z
    .string()
    .optional()
    .describe(
      'Token returned by the preview call; must be supplied with confirm: true.',
    ),
});

type Params = z.infer<typeof DeleteComponentTypeToolParams>;

export function deleteComponentTypeTool(config: ContentfulConfig) {
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
    const componentType = await contentfulClient.componentType.get(params);

    const expectedToken = buildConfirmToken(
      'componentType',
      args.componentTypeId,
      componentType.sys.version,
    );
    if (args.confirm !== true || args.confirmToken !== expectedToken) {
      return createSuccessResponse(
        `${CONFIRMATION_MESSAGE_PREFIX} component type`,
        buildConfirmationPreview(
          'componentType',
          args.componentTypeId,
          { componentType },
          expectedToken,
        ),
      );
    }

    await contentfulClient.componentType.delete(params);

    return createSuccessResponse('Component type deleted successfully', {
      componentTypeId: args.componentTypeId,
    });
  }

  return withErrorHandling(tool, 'Error deleting component type');
}
