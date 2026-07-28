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

export const DeleteFragmentToolParams = BaseToolSchema.extend({
  fragmentId: z.string().describe('The ID of the fragment to delete'),
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

type Params = z.infer<typeof DeleteFragmentToolParams>;

export function deleteFragmentTool(config: ContentfulConfig) {
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
    const fragment = await contentfulClient.fragment.get(params);

    const expectedToken = buildConfirmToken(
      'fragment',
      args.fragmentId,
      fragment.sys.version,
    );
    if (args.confirm !== true || args.confirmToken !== expectedToken) {
      return createSuccessResponse(
        `${CONFIRMATION_MESSAGE_PREFIX} fragment`,
        buildConfirmationPreview(
          'fragment',
          args.fragmentId,
          { fragment },
          expectedToken,
        ),
      );
    }

    await contentfulClient.fragment.delete(params);

    return createSuccessResponse('Fragment deleted successfully', {
      fragmentId: args.fragmentId,
    });
  }

  return withErrorHandling(tool, 'Error deleting fragment');
}
