import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import {
  BaseToolSchema,
  createExoToolClient,
  assertEnvironmentNotProtected,
} from '../../../utils/tools.js';
import {
  buildConfirmToken,
  buildConfirmationPreview,
  CONFIRMATION_MESSAGE_PREFIX,
} from '../../../utils/confirmation.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const DeleteComponentToolParams = BaseToolSchema.extend({
  componentId: z.string().describe('The ID of the component to delete'),
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

type Params = z.infer<typeof DeleteComponentToolParams>;

export function deleteComponentTool(config: ContentfulConfig) {
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

    const contentfulClient = createExoToolClient(config, args);
    const component = await contentfulClient.component.get(params);

    const expectedToken = buildConfirmToken(
      'component',
      args.componentId,
      component.sys.version,
    );
    if (args.confirm !== true || args.confirmToken !== expectedToken) {
      return createSuccessResponse(
        `${CONFIRMATION_MESSAGE_PREFIX} component`,
        buildConfirmationPreview(
          'component',
          args.componentId,
          { component },
          expectedToken,
        ),
      );
    }

    await contentfulClient.component.delete(params);

    return createSuccessResponse('Component deleted successfully', {
      componentId: args.componentId,
    });
  }

  return withErrorHandling(tool, 'Error deleting component');
}
