import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { FieldSchema } from '../../types/fieldSchema.js';

export const CreateContentTypeToolParams = BaseToolSchema.extend({
  name: z.string().describe('The name of the content type'),
  displayField: z.string().describe('The field ID to use as the display field'),
  description: z
    .string()
    .optional()
    .describe('Description of the content type'),
  fields: z
    .array(FieldSchema)
    .describe('Array of field definitions for the content type'),
});

type Params = z.infer<typeof CreateContentTypeToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  // Create the content type
  const contentType = await contentfulClient.contentType.create(params, {
    name: args.name,
    displayField: args.displayField,
    description: args.description,
    fields: args.fields,
  });

  return createSuccessResponse('Content type created successfully', {
    contentType,
  });
}

export const createContentTypeTool = withErrorHandling(
  tool,
  'Error creating content type',
);
