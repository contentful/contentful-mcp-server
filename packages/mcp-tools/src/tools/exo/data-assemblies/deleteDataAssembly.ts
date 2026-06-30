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

export const DeleteDataAssemblyToolParams = BaseToolSchema.extend({
  dataAssemblyId: z.string().describe('The ID of the data assembly to delete'),
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

type Params = z.infer<typeof DeleteDataAssemblyToolParams>;

export function deleteDataAssemblyTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      dataAssemblyId: args.dataAssemblyId,
    };

    const contentfulClient = createToolClient(config, args);
    const dataAssembly = await contentfulClient.dataAssembly.get(params);

    const expectedToken = buildConfirmToken(
      'dataAssembly',
      args.dataAssemblyId,
      dataAssembly.sys.version,
    );
    if (args.confirm !== true || args.confirmToken !== expectedToken) {
      return createSuccessResponse(
        `${CONFIRMATION_MESSAGE_PREFIX} data assembly`,
        buildConfirmationPreview(
          'dataAssembly',
          args.dataAssemblyId,
          { dataAssembly },
          expectedToken,
        ),
      );
    }

    await contentfulClient.dataAssembly.delete(params);

    return createSuccessResponse('Data assembly deleted successfully', {
      dataAssemblyId: args.dataAssemblyId,
    });
  }

  return withErrorHandling(tool, 'Error deleting data assembly');
}
