import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { FieldSchema } from '../../types/fieldSchema.js';

type FieldType = z.infer<typeof FieldSchema>;

export const UpdateContentTypeToolParams = BaseToolSchema.extend({
  contentTypeId: z.string().describe('The ID of the content type to update'),
  name: z.string().optional().describe('The name of the content type'),
  displayField: z.string().optional().describe('The field ID to use as the display field'),
  description: z.string().optional().describe('Description of the content type'),
  fields: z.array(FieldSchema).optional().describe('Array of field definitions for the content type. Will be merged with existing fields.'),
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
    const existingFieldsMap = currentContentType.fields.reduce((acc: Record<string, FieldType>, field: FieldType) => {
      acc[field.id] = field;
      return acc;
    }, {});

    // Ensure each field has all required metadata
    fields.forEach((field: FieldType) => {
      const existingField = existingFieldsMap[field.id];
      if (existingField) {
        // Preserve validations if not explicitly changed
        field.validations = field.validations || existingField.validations;

        // Preserve required flag if not explicitly set, default to false
        field.required = field.required !== undefined ? field.required : (existingField.required || false);

        // Preserve link type for Link fields
        if (field.type === 'Link' && !field.linkType && existingField.linkType) {
          field.linkType = existingField.linkType;
        }

        // Preserve items for Array fields
        if (field.type === 'Array' && !field.items && existingField.items) {
          field.items = existingField.items;
        }
      } else {
        // For new fields, ensure required is a boolean
        field.required = field.required || false;
      }
    });
  }

  // Update the content type
  const contentType = await contentfulClient.contentType.update(
    params,
    {
      ...currentContentType,
      name: args.name || currentContentType.name,
      description: args.description || currentContentType.description,
      displayField: args.displayField || currentContentType.displayField,
      fields: fields as typeof currentContentType.fields,
    },
  );

  return createSuccessResponse('Content type updated successfully', 
    { contentType });
}

export const updateContentTypeTool = withErrorHandling(
  tool,
  'Error updating content type',
); 