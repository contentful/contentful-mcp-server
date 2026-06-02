import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { createClient } from 'contentful-management';
import { createClientConfig } from '../../../utils/tools.js';
import {
  buildConfirmToken,
  buildConfirmationPreview,
  CONFIRMATION_MESSAGE_PREFIX,
} from '../../../utils/confirmation.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const DeleteConceptSchemeToolParams = z.object({
  organizationId: z.string().describe('The ID of the Contentful organization'),
  conceptSchemeId: z
    .string()
    .describe('The ID of the concept scheme to delete'),
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

type Params = z.infer<typeof DeleteConceptSchemeToolParams>;

export function deleteConceptSchemeTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    // Create a client without space-specific configuration for concept scheme operations
    const clientConfig = createClientConfig(config);
    // Remove space from config since we're working at the organization level
    delete clientConfig.space;
    const contentfulClient = createClient(clientConfig);

    const conceptScheme = await contentfulClient.conceptScheme.get({
      organizationId: args.organizationId,
      conceptSchemeId: args.conceptSchemeId,
    });

    const expectedToken = buildConfirmToken(
      'conceptScheme',
      args.conceptSchemeId,
      conceptScheme.sys.version,
    );
    if (args.confirm !== true || args.confirmToken !== expectedToken) {
      return createSuccessResponse(
        `${CONFIRMATION_MESSAGE_PREFIX} concept scheme`,
        buildConfirmationPreview(
          'conceptScheme',
          args.conceptSchemeId,
          { conceptScheme },
          expectedToken,
        ),
      );
    }

    await contentfulClient.conceptScheme.delete({
      organizationId: args.organizationId,
      conceptSchemeId: args.conceptSchemeId,
      version: conceptScheme.sys.version,
    });

    return createSuccessResponse('Concept scheme deleted successfully', {
      conceptSchemeId: args.conceptSchemeId,
    });
  }

  return withErrorHandling(tool, 'Error deleting concept scheme');
}
