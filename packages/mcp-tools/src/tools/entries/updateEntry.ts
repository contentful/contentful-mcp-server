import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { EntryMetadataSchema } from '../../types/taxonomySchema.js';
import { entryFieldsSchema } from '../../types/entryFieldSchema.js';
import type { ContentfulConfig } from '../../config/types.js';

export const UpdateEntryToolParams = BaseToolSchema.extend({
  entryId: z.string().describe('The ID of the entry to update'),
  fields: entryFieldsSchema.describe(
    'The field values to update. Keys should be field IDs and values should be the field content. Will be merged with existing fields.',
  ),
  metadata: EntryMetadataSchema,
});

type Params = z.infer<typeof UpdateEntryToolParams>;

export function updateEntryTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      entryId: args.entryId,
    };

    const contentfulClient = createToolClient(config, args);

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

    const allConcepts = [
      ...(existingEntry.metadata?.concepts || []),
      ...(args.metadata?.concepts || []),
    ];

    // Update the entry with merged fields
    const updatedEntry = await contentfulClient.entry.update(params, {
      ...existingEntry,
      fields: mergedFields,
      metadata: {
        tags: allTags,
        concepts: allConcepts,
      },
    });

    //return info about the entry that was updated
    return createSuccessResponse('Entry updated successfully', {
      updatedEntry,
    });
  }

  return withErrorHandling(tool, 'Error updating entry');
}
