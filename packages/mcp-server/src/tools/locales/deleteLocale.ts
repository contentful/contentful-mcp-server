import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const DeleteLocaleToolParams = BaseToolSchema.extend({
  localeId: z.string().describe('The ID of the locale to delete'),
});

type Params = z.infer<typeof DeleteLocaleToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
    localeId: args.localeId,
  };

  const contentfulClient = createToolClient(args);

  // First, get the locale to check its current state
  const locale = await contentfulClient.locale.get(params);

  // Delete the locale
  await contentfulClient.locale.delete(params);

  // Return info about the locale that was deleted
  return createSuccessResponse('Locale deleted successfully', { locale });
}

export const deleteLocaleTool = withErrorHandling(
  tool,
  'Error deleting locale',
);
