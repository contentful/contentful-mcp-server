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

export const DeleteEntryToolParams = BaseToolSchema.extend({
  entryId: z.string().describe('The ID of the entry to delete'),
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

type Params = z.infer<typeof DeleteEntryToolParams>;

export function deleteEntryTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      entryId: args.entryId,
    };

    const contentfulClient = createToolClient(config, args);
    const entry = await contentfulClient.entry.get(params);

    const expectedToken = buildConfirmToken('entry', args.entryId, entry.sys.version);
    if (args.confirm !== true || args.confirmToken !== expectedToken) {
      return createSuccessResponse(
        `${CONFIRMATION_MESSAGE_PREFIX} entry`,
        buildConfirmationPreview('entry', args.entryId, { entry }, expectedToken),
      );
    }

    await contentfulClient.entry.delete(params);
    return createSuccessResponse('Entry deleted successfully', { entry });
  }

  return withErrorHandling(tool, 'Error deleting entry');
}
