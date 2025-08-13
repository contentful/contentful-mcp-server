import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { FieldSchema } from '../../types/fieldSchema.js';

export const UpdateContentTypeToolParams = BaseToolSchema.extend({
  contentTypeId: z.string().describe('The ID of the content type to update'),
  name: z.string().optional().describe('The name of the content type'),
  displayField: z
    .string()
    .optional()
    .describe('The field ID to use as the display field'),
  description: z
    .string()
    .optional()
    .describe('Description of the content type'),
  fields: z
    .array(FieldSchema)
    .optional()
    .describe(
      'Array of field definitions for the content type. Will be merged with existing fields.',
    ),
});

type Params = z.infer<typeof UpdateContentTypeToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
    contentTypeId: args.contentTypeId,
  };

  const contentfulClient = createToolClient(args);

  // Get the current content type
  const currentContentType = await contentfulClient.contentType.get(params);

  // Use the new fields if provided, otherwise keep existing fields
  const fields = args.fields || currentContentType.fields;

  // If fields are provided, ensure we're not removing any required field metadata
  if (args.fields) {
    const existingFieldsMap = new Map(
      currentContentType.fields.map((field) => [field.id, field]),
    );

    // Preserve metadata from existing fields
    args.fields.forEach((field) => {
      const existingField = existingFieldsMap.get(field.id);
      if (existingField) {
        // Preserve validations if not explicitly changed
        if (!field.validations && existingField.validations) {
          field.validations = existingField.validations;
        }

        // Preserve link type for Link fields
        if (
          field.type === 'Link' &&
          !field.linkType &&
          existingField.linkType
        ) {
          field.linkType = existingField.linkType;
        }

        // Preserve items for Array fields
        if (field.type === 'Array' && !field.items && existingField.items) {
          field.items = existingField.items;
        }
      }
    });
  }

  // Update the content type
  const contentType = await contentfulClient.contentType.update(params, {
    ...currentContentType,
    name: args.name || currentContentType.name,
    description: args.description || currentContentType.description,
    displayField: args.displayField || currentContentType.displayField,
    fields: fields as typeof currentContentType.fields,
  });

  return createSuccessResponse('Content type updated successfully', {
    contentType,
  });
}

export const updateContentTypeTool = withErrorHandling(
  tool,
  'Error updating content type',
);
