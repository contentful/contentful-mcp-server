import { z } from 'zod' 

export const FieldSchema = z.object({
    id: z.string().describe('The field ID'),
    name: z.string().describe('The field name'),
    type: z.string().describe('The field type (e.g., "Symbol", "Text", "Integer", "Boolean", "Date", "Location", "Link", "Array", "Object")'),
    required: z.boolean().optional().describe('Whether the field is required'),
    localized: z.boolean().optional().describe('Whether the field is localized'),
    disabled: z.boolean().optional().describe('Whether the field is disabled'),
    omitted: z.boolean().optional().describe('Whether the field is omitted from the API response'),
    validations: z.array(z.any()).optional().describe('Field validations'),
    settings: z.record(z.any()).optional().describe('Field-specific settings'),
    linkType: z.string().optional().describe('Link type for Link fields (e.g., "Entry", "Asset")'),
    items: z.object({
      type: z.string(),
      linkType: z.string().optional(),
      validations: z.array(z.any()).optional(),
    }).optional().describe('Items configuration for Array fields'),
  });