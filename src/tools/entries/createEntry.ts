import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const CreateEntryToolParams = BaseToolSchema.extend({
  contentTypeId: z.string().describe('The ID of the content type to create an entry for'),
  fields: z.record(z.any()).describe('The field values for the new entry. Keys should be field IDs and values should be the field content.'),
  publish: z.boolean().optional().default(false).describe('Whether to publish the entry immediately after creation'),
});

type Params = z.infer<typeof CreateEntryToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  // Create the entry
  const newEntry = await contentfulClient.entry.create(
    {
      ...params,
      contentTypeId: args.contentTypeId,
    },
    {
      fields: args.fields,
    }
  );

  // Optionally publish the entry if requested
  if (args.publish && newEntry.sys.publishedVersion === undefined) {
    await contentfulClient.entry.publish(
      {
        ...params,
        entryId: newEntry.sys.id,
      },
      newEntry
    );
  }

  return createSuccessResponse('Entry created successfully', { newEntry }
  );
}

export const createEntryTool = withErrorHandling(
  tool,
  'Error creating entry',
);