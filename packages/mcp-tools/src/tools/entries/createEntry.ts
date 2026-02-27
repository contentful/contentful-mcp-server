import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { EntryMetadataSchema } from '../../types/taxonomySchema.js';
import { entryFieldsSchema } from '../../types/entryFieldSchema.js';
import type { ContentfulConfig } from '../../config/types.js';

export const CreateEntryToolParams = BaseToolSchema.extend({
  contentTypeId: z
    .string()
    .describe('The ID of the content type to create an entry for'),
  fields: entryFieldsSchema.describe(
    'The field values for the new entry. Keys should be field IDs and values should be the field content.',
  ),
  metadata: EntryMetadataSchema,
});

type Params = z.infer<typeof CreateEntryToolParams>;

export function createEntryTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
    };

    const contentfulClient = await createToolClient(config, args);
    const newEntry = await contentfulClient.entry.create(
      {
        ...params,
        contentTypeId: args.contentTypeId,
      },
      {
        fields: args.fields,
        ...(args.metadata ? { metadata: args.metadata } : {}),
      },
    );

    //return info about the entry that was created
    return createSuccessResponse('Entry created successfully', { newEntry });
  }

  return withErrorHandling(tool, 'Error creating entry');
}
