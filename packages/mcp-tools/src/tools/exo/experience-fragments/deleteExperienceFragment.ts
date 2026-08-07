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

export const DeleteExperienceFragmentToolParams = BaseToolSchema.extend({
  experienceFragmentId: z
    .string()
    .describe('The ID of the experience fragment to delete'),
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

type Params = z.infer<typeof DeleteExperienceFragmentToolParams>;

export function deleteExperienceFragmentTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      experienceFragmentId: args.experienceFragmentId,
    };

    const contentfulClient = createToolClient(config, args);
    const experienceFragment =
      await contentfulClient.experienceFragment.get(params);

    const expectedToken = buildConfirmToken(
      'experienceFragment',
      args.experienceFragmentId,
      experienceFragment.sys.version,
    );
    if (args.confirm !== true || args.confirmToken !== expectedToken) {
      return createSuccessResponse(
        `${CONFIRMATION_MESSAGE_PREFIX} experience fragment`,
        buildConfirmationPreview(
          'experienceFragment',
          args.experienceFragmentId,
          { experienceFragment },
          expectedToken,
        ),
      );
    }

    await contentfulClient.experienceFragment.delete(params);

    return createSuccessResponse('Experience fragment deleted successfully', {
      experienceFragmentId: args.experienceFragmentId,
    });
  }

  return withErrorHandling(tool, 'Error deleting experience fragment');
}
