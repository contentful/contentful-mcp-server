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

export const DeleteExperienceToolParams = BaseToolSchema.extend({
  experienceId: z.string().describe('The ID of the experience to delete'),
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

type Params = z.infer<typeof DeleteExperienceToolParams>;

export function deleteExperienceTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      experienceId: args.experienceId,
    };

    const contentfulClient = createToolClient(config, args);
    const experience = await contentfulClient.experience.get(params);

    const expectedToken = buildConfirmToken(
      'experience',
      args.experienceId,
      experience.sys.version,
    );
    if (args.confirm !== true || args.confirmToken !== expectedToken) {
      return createSuccessResponse(
        `${CONFIRMATION_MESSAGE_PREFIX} experience`,
        buildConfirmationPreview(
          'experience',
          args.experienceId,
          { experience },
          expectedToken,
        ),
      );
    }

    await contentfulClient.experience.delete(params);

    return createSuccessResponse('Experience deleted successfully', {
      experienceId: args.experienceId,
    });
  }

  return withErrorHandling(tool, 'Error deleting experience');
}
