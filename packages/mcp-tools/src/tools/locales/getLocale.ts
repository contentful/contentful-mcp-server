import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const GetLocaleToolParams = BaseToolSchema.extend({
  localeId: z.string().describe('The ID of the locale to retrieve'),
});

type Params = z.infer<typeof GetLocaleToolParams>;

export function getLocaleTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      localeId: args.localeId,
    };

    const contentfulClient = createToolClient(config, args);

    // Get the locale
    const locale = await contentfulClient.locale.get(params);

    return createSuccessResponse('Locale retrieved successfully', { locale });
  }

  return withErrorHandling(tool, 'Error retrieving locale');
}
