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

export const DeleteTemplateToolParams = BaseToolSchema.extend({
  templateId: z.string().describe('The ID of the template to delete'),
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

type Params = z.infer<typeof DeleteTemplateToolParams>;

export function deleteTemplateTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      templateId: args.templateId,
    };

    const contentfulClient = createToolClient(config, args);
    const template = await contentfulClient.template.get(params);

    const expectedToken = buildConfirmToken(
      'template',
      args.templateId,
      template.sys.version,
    );
    if (args.confirm !== true || args.confirmToken !== expectedToken) {
      return createSuccessResponse(
        `${CONFIRMATION_MESSAGE_PREFIX} template`,
        buildConfirmationPreview(
          'template',
          args.templateId,
          { template },
          expectedToken,
        ),
      );
    }

    await contentfulClient.template.delete(params);

    return createSuccessResponse('Template deleted successfully', {
      templateId: args.templateId,
    });
  }

  return withErrorHandling(tool, 'Error deleting template');
}
