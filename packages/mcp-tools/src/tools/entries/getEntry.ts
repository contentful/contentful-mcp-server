import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const GetEntryToolParams = BaseToolSchema.extend({
  entryId: z.string().describe('The ID of the entry to retrieve'),
});

type Params = z.infer<typeof GetEntryToolParams>;

export function getEntryTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      entryId: args.entryId,
    };

    const contentfulClient = createToolClient(config, args);

    // Get the entry
    const entry = await contentfulClient.entry.get(params);

    return createSuccessResponse('Entry retrieved successfully', { entry });
  }

  return withErrorHandling(tool, 'Error retrieving entry');
}
