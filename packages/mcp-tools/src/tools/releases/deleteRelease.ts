import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import {
  BaseToolSchema,
  createToolClient,
  assertEnvironmentNotProtected,
} from '../../utils/tools.js';
import {
  buildConfirmToken,
  buildConfirmationPreview,
  CONFIRMATION_MESSAGE_PREFIX,
} from '../../utils/confirmation.js';
import type { ContentfulConfig } from '../../config/types.js';

export const DeleteReleaseToolParams = BaseToolSchema.extend({
  releaseId: z.string().describe('The ID of the release to delete'),
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

type Params = z.infer<typeof DeleteReleaseToolParams>;

export function deleteReleaseTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      releaseId: args.releaseId,
    };

    const contentfulClient = createToolClient(config, args);
    const release = await contentfulClient.release.get(params);

    const expectedToken = buildConfirmToken(
      'release',
      args.releaseId,
      release.sys.version,
    );
    if (args.confirm !== true || args.confirmToken !== expectedToken) {
      const preview = buildConfirmationPreview(
        'release',
        args.releaseId,
        { release },
        expectedToken,
      );
      return createSuccessResponse(`${CONFIRMATION_MESSAGE_PREFIX} release`, {
        ...preview,
        instructions: `${preview.instructions} Deleting a release also permanently deletes all ReleaseActions linked to it.`,
      });
    }

    await contentfulClient.release.delete(params);

    return createSuccessResponse('Release deleted successfully', { release });
  }

  return withErrorHandling(tool, 'Error deleting release');
}
