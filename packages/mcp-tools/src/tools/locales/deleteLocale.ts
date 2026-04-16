import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const DeleteLocaleToolParams = BaseToolSchema.extend({
  localeId: z.string().describe('The ID of the locale to delete'),
});

type Params = z.infer<typeof DeleteLocaleToolParams>;

export function deleteLocaleTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      localeId: args.localeId,
    };

    const contentfulClient = await createToolClient(config, args);

    // First, get the locale to check its current state
    const locale = await contentfulClient.locale.get(params);

    // Delete the locale
    await contentfulClient.locale.delete(params);

    // Return info about the locale that was deleted
    return createSuccessResponse('Locale deleted successfully', { locale });
  }

  return withErrorHandling(tool, 'Error deleting locale');
}
