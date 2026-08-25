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

export const DeleteExperienceTemplateToolParams = BaseToolSchema.extend({
  experienceTemplateId: z
    .string()
    .describe('The ID of the experience template to delete'),
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

type Params = z.infer<typeof DeleteExperienceTemplateToolParams>;

export function deleteExperienceTemplateTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      experienceTemplateId: args.experienceTemplateId,
    };

    const contentfulClient = createExoToolClient(config, args);
    const experienceTemplate =
      await contentfulClient.experienceTemplate.get(params);

    const expectedToken = buildConfirmToken(
      'experienceTemplate',
      args.experienceTemplateId,
      experienceTemplate.sys.version,
    );
    if (args.confirm !== true || args.confirmToken !== expectedToken) {
      return createSuccessResponse(
        `${CONFIRMATION_MESSAGE_PREFIX} experience template`,
        buildConfirmationPreview(
          'experienceTemplate',
          args.experienceTemplateId,
          { experienceTemplate },
          expectedToken,
        ),
      );
    }

    await contentfulClient.experienceTemplate.delete(params);

    return createSuccessResponse('Experience template deleted successfully', {
      experienceTemplateId: args.experienceTemplateId,
    });
  }

  return withErrorHandling(tool, 'Error deleting experience template');
}
