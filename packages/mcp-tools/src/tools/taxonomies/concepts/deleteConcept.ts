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

export const DeleteConceptToolParams = z.object({
  organizationId: z.string().describe('The ID of the Contentful organization'),
  conceptId: z.string().describe('The ID of the concept to delete'),
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

type Params = z.infer<typeof DeleteConceptToolParams>;

export function deleteConceptTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    // Create a client without space-specific configuration for concept operations
    const clientConfig = createClientConfig(config);
    // Remove space from config since we're working at the organization level
    delete clientConfig.space;
    const contentfulClient = createClient(clientConfig);

    const concept = await contentfulClient.concept.get({
      organizationId: args.organizationId,
      conceptId: args.conceptId,
    });

    const expectedToken = buildConfirmToken(
      'concept',
      args.conceptId,
      concept.sys.version,
    );
    if (args.confirm !== true || args.confirmToken !== expectedToken) {
      return createSuccessResponse(
        `${CONFIRMATION_MESSAGE_PREFIX} concept`,
        buildConfirmationPreview('concept', args.conceptId, { concept }, expectedToken),
      );
    }

    await contentfulClient.concept.delete({
      organizationId: args.organizationId,
      conceptId: args.conceptId,
      version: concept.sys.version,
    });

    return createSuccessResponse('Concept deleted successfully', {
      conceptId: args.conceptId,
    });
  }

  return withErrorHandling(tool, 'Error deleting concept');
}
