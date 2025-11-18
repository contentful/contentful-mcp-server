import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { FieldSchema } from '../../types/fieldSchema.js';
import { ContentTypeMetadataSchema } from '../../types/taxonomySchema.js';

export const CreateContentTypeToolParams = BaseToolSchema.extend({
  name: z.string().describe('The name of the content type'),
  displayField: z.string().describe('The field ID to use as the display field'),
  description: z
    .string()
    .optional()
    .describe('Description of the content type'),
  contentTypeId: z
    .string()
    .optional()
    .describe(
      'Optional ID for the content type. If provided, will use createWithId method',
    ),
  fields: z
    .array(FieldSchema)
    .describe('Array of field definitions for the content type'),
  metadata: ContentTypeMetadataSchema,
});

type Params = z.infer<typeof CreateContentTypeToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  const contentTypeData = {
    name: args.name,
    displayField: args.displayField,
    description: args.description,
    fields: args.fields,
    metadata: args.metadata,
  };

  // Create the content type with or without ID
  const contentType = args.contentTypeId
    ? await contentfulClient.contentType.createWithId(
        { ...params, contentTypeId: args.contentTypeId },
        contentTypeData,
      )
    : await contentfulClient.contentType.create(params, contentTypeData);

  return createSuccessResponse('Content type created successfully', {
    contentType,
  });
}

export const createContentTypeTool = withErrorHandling(
  tool,
  'Error creating content type',
);
