import { z } from 'zod';

/**
 * Shared query schema for entries - used by searchEntries, exportSpace, etc.
 */
export const EntryQuerySchema = z.object({
  content_type: z.string().optional().describe('Filter by content type'),
  include: z
    .number()
    .optional()
    .describe('Include this many levels of linked entries'),
  select: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),
  links_to_entry: z
    .string()
    .optional()
    .describe('Find entries that link to the specified entry ID'),
  limit: z.number().optional().describe('Maximum number of entries to return'),
  skip: z.number().optional().describe('Skip this many entries'),
  order: z.string().optional().describe('Order entries by this field'),
});

/**
 * Shared query schema for assets - used by listAssets, exportSpace, etc.
 */
export const AssetQuerySchema = z.object({
  mimetype_group: z.string().optional().describe('Filter by MIME type group'),
  select: z
    .string()
    .optional()
    .describe('Comma-separated list of fields to return'),
  limit: z.number().optional().describe('Maximum number of assets to return'),
  skip: z.number().optional().describe('Skip this many assets'),
  order: z.string().optional().describe('Order assets by this field'),
});

export type EntryQuery = z.infer<typeof EntryQuerySchema>;
export type AssetQuery = z.infer<typeof AssetQuerySchema>;
