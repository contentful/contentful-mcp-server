import { z } from 'zod';
import { INLINES, BLOCKS } from '@contentful/rich-text-types';

/**
 * Zod schemas for Content Type Field Validation
 *
 * These schemas mirror the `ContentTypeFieldValidation` from contentful-management
 * (see node_modules/contentful-management/dist/typings/entities/content-type-fields.d.ts)
 *
 * They define the validation rules that can be applied to content type fields
 * in Contentful, such as size limits, allowed content types for references,
 * date ranges, regular expressions, etc.
 */

/**
 * Schema for numeric range validation
 * Used to validate numeric fields with minimum and maximum constraints
 */
const NumRange = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
});

/**
 * Schema for date range validation
 * Used to validate date fields with minimum and maximum date constraints
 */
const DateRange = z.object({
  min: z.string().optional(),
  max: z.string().optional(),
});

/**
 * Schema for regular expression validation
 * Defines a pattern and flags for validating text with regular expressions
 */
const RegExpSchema = z.object({
  pattern: z.string(),
  flags: z.string(),
});

/**
 * Schema for validating image dimensions in assets
 * Allows specifying width and height constraints
 */
const AssetImageDimensions = z.object({
  width: NumRange.optional(),
  height: NumRange.optional(),
});

/**
 * Schema for external resource references
 * Used for linking to resources outside of Contentful
 */
export const ExternalResource = z.object({
  type: z.string(),
});

/**
 * Schema for Contentful entry resources
 * Used for linking to specific content types within Contentful
 */
export const ContentfulEntryResource = z.object({
  type: z.literal('Contentful:Entry'),
  source: z.string(),
  contentTypes: z.array(z.string()),
});

/**
 * Union of allowed resource types for content linking
 * Can be either Contentful entries or external resources
 */
export const ContentTypeAllowedResources = z.union([
  ContentfulEntryResource,
  ExternalResource,
]);

/**
 * Schema for validating nodes in rich text fields
 * Defines validations for embedded entries, assets, and other node types
 */
const NodesValidation = z.record(
  z
    .array(
      z.object({
        // subset of ContentTypeFieldValidation used for node validations
        size: NumRange.optional(),
        linkContentType: z.array(z.string()).optional(),
        message: z.string().nullable().optional(),
      }),
    )
    .or(
      z.object({
        validations: z.array(
          z.object({
            size: NumRange.optional(),
            message: z.string().nullable().optional(),
          }),
        ),
        allowedResources: z.array(ContentTypeAllowedResources),
      }),
    ),
);

/**
 * Main schema for content type field validation
 *
 * This comprehensive schema defines all possible validation rules that can be
 * applied to content type fields in Contentful, including:
 * - Link validations (content types, MIME types)
 * - Value constraints (allowed values, size limits, ranges)
 * - Text validations (regular expressions)
 * - Rich text validations (allowed node types, marks)
 * - Asset validations (file size, image dimensions)
 * - Custom error messages
 */
export const ContentTypeFieldValidationSchema = z.object({
  linkContentType: z.array(z.string()).optional(),
  in: z.array(z.union([z.string(), z.number()])).optional(),
  linkMimetypeGroup: z.array(z.string()).optional(),
  enabledNodeTypes: z
    .array(z.union([z.nativeEnum(BLOCKS), z.nativeEnum(INLINES)]))
    .optional(),
  enabledMarks: z.array(z.string()).optional(),
  unique: z.boolean().optional(),
  size: NumRange.optional(),
  range: NumRange.optional(),
  dateRange: DateRange.optional(),
  regexp: RegExpSchema.optional(),
  message: z.string().nullable().optional(),
  prohibitRegexp: RegExpSchema.optional(),
  assetImageDimensions: AssetImageDimensions.optional(),
  assetFileSize: NumRange.optional(),
  nodes: NodesValidation.optional(),
});

/**
 * Type derived from the ContentTypeFieldValidationSchema
 * Used for typing variables and parameters throughout the application
 */
export type ContentTypeFieldValidation = z.infer<
  typeof ContentTypeFieldValidationSchema
>;
