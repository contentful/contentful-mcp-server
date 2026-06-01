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

export const DeleteContentTypeToolParams = BaseToolSchema.extend({
  contentTypeId: z.string().describe('The ID of the content type to delete'),
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

type Params = z.infer<typeof DeleteContentTypeToolParams>;

export function deleteContentTypeTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      contentTypeId: args.contentTypeId,
    };

    const contentfulClient = createToolClient(config, args);
    const contentType = await contentfulClient.contentType.get(params);

    const expectedToken = buildConfirmToken(
      'contentType',
      args.contentTypeId,
      contentType.sys.version,
    );
    if (args.confirm !== true || args.confirmToken !== expectedToken) {
      return createSuccessResponse(
        `${CONFIRMATION_MESSAGE_PREFIX} content type`,
        buildConfirmationPreview(
          'contentType',
          args.contentTypeId,
          { contentType },
          expectedToken,
        ),
      );
    }

    await contentfulClient.contentType.delete(params);

    return createSuccessResponse('Content type deleted successfully', {
      contentTypeId: args.contentTypeId,
    });
  }

  return withErrorHandling(tool, 'Error deleting content type');
}
