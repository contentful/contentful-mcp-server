import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const UpdateEntryToolParams = BaseToolSchema.extend({
  entryId: z.string().describe('The ID of the entry to update'),
  fields: z
    .record(z.any())
    .describe(
      'The field values to update. Keys should be field IDs and values should be the field content. Will be merged with existing fields.',
    ),
  metadata: z
    .object({
      tags: z.array(
        z.object({
          sys: z.object({
            type: z.literal('Link'),
            linkType: z.literal('Tag'),
            id: z.string(),
          }),
        }),
      ),
    })
    .optional(),
});

type Params = z.infer<typeof UpdateEntryToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
    entryId: args.entryId,
  };

  const contentfulClient = createToolClient(args);

  // First, get the existing entry
  const existingEntry = await contentfulClient.entry.get(params);

  // Merge the provided fields with existing fields
  const mergedFields = {
    ...existingEntry.fields,
    ...args.fields,
  };

  const allTags = [
    ...(existingEntry.metadata?.tags || []),
    ...(args.metadata?.tags || []),
  ];

  // Update the entry with merged fields
  const updatedEntry = await contentfulClient.entry.update(params, {
    ...existingEntry,
    fields: mergedFields,
    metadata: {
      tags: allTags,
    },
  });

  //return info about the entry that was updated
  return createSuccessResponse('Entry updated successfully', { updatedEntry });
}

export const updateEntryTool = withErrorHandling(tool, 'Error updating entry');
