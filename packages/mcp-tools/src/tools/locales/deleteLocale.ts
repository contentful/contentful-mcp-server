import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import {
  buildConfirmToken,
  buildConfirmationPreview,
  CONFIRMATION_MESSAGE_PREFIX,
} from '../../utils/confirmation.js';
import type { ContentfulConfig } from '../../config/types.js';

export const DeleteLocaleToolParams = BaseToolSchema.extend({
  localeId: z.string().describe('The ID of the locale to delete'),
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

type Params = z.infer<typeof DeleteLocaleToolParams>;

export function deleteLocaleTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      localeId: args.localeId,
    };

    const contentfulClient = createToolClient(config, args);
    const locale = await contentfulClient.locale.get(params);

    const expectedToken = buildConfirmToken('locale', args.localeId, locale.sys.version);
    if (args.confirm !== true || args.confirmToken !== expectedToken) {
      return createSuccessResponse(
        `${CONFIRMATION_MESSAGE_PREFIX} locale`,
        buildConfirmationPreview('locale', args.localeId, { locale }, expectedToken),
      );
    }

    await contentfulClient.locale.delete(params);

    return createSuccessResponse('Locale deleted successfully', { locale });
  }

  return withErrorHandling(tool, 'Error deleting locale');
}
