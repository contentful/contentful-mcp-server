import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const DeleteEntryToolParams = BaseToolSchema.extend({
  entryId: z.string().describe('The ID of the entry to delete'),
});

type Params = z.infer<typeof DeleteEntryToolParams>;

export function deleteEntryTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      entryId: args.entryId,
    };

    const contentfulClient = await createToolClient(config, args);

    // First, get the entry to check its status
    const entry = await contentfulClient.entry.get(params);

    // Delete the entry
    await contentfulClient.entry.delete(params);

    //return info about the entry that was deleted
    return createSuccessResponse('Entry deleted successfully', { entry });
  }

  return withErrorHandling(tool, 'Error deleting entry');
}
