import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const DeleteEntryToolParams = BaseToolSchema.extend({
  entryId: z.string().describe('The ID of the entry to delete'),
});

type Params = z.infer<typeof DeleteEntryToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
    entryId: args.entryId,
  };

  const contentfulClient = createToolClient(args);

  // First, get the entry to check its status
  const entry = await contentfulClient.entry.get(params);


  // Delete the entry
  await contentfulClient.entry.delete(params);

  //return info about the entry that was deleted
  return createSuccessResponse('Entry deleted successfully', { entry });
}

export const deleteEntryTool = withErrorHandling(
  tool,
  'Error deleting entry',
); 