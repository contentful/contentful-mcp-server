import { z } from 'zod';

/**
 * Schema for taxonomy concept validation links
 * Matches Contentful's TaxonomyConceptValidationLink type
 */
export const TaxonomyConceptValidationLinkSchema = z.object({
  sys: z.object({
    type: z.literal('Link'),
    linkType: z.literal('TaxonomyConcept'),
    id: z.string().describe('The ID of the taxonomy concept'),
  }),
  required: z.boolean().optional(),
});

/**
 * Schema for taxonomy concept scheme validation links
 * Matches Contentful's TaxonomyConceptSchemeValidationLink type
 */
export const TaxonomyConceptSchemeValidationLinkSchema = z.object({
  sys: z.object({
    type: z.literal('Link'),
    linkType: z.literal('TaxonomyConceptScheme'),
    id: z.string().describe('The ID of the taxonomy concept scheme'),
  }),
  required: z.boolean().optional(),
});

/**
 * Union schema for taxonomy validation links
 * Matches the array type expected by Contentful's ContentTypeMetadata.taxonomy
 */
export const TaxonomyValidationLinkSchema = z.union([
  TaxonomyConceptValidationLinkSchema,
  TaxonomyConceptSchemeValidationLinkSchema,
]);

/**
 * Schema for content type metadata
 * Matches Contentful's ContentTypeMetadata type structure
 */
export const ContentTypeMetadataSchema = z
  .object({
    taxonomy: z.array(TaxonomyValidationLinkSchema).optional(),
  })
  .optional();

/**
 * Schema for entry type metadata
 * Matches Contentful's MetadataProps type structure
 */
export const EntryMetadataSchema = z
  .object({
    tags: z.array(
      z.object({
        sys: z.object({
          type: z.literal('Link'),
          linkType: z.literal('Tag'),
          id: z.string(),
        }),
      }),
    ),
    concepts: z
      .array(
        z.object({
          sys: z.object({
            type: z.literal('Link'),
            linkType: z.literal('TaxonomyConcept'),
            id: z.string(),
          }),
        }),
      )
      .optional(),
  })
  .optional();

/**
 * Schema for asset type metadata
 * Matches Contentful's asset metadata structure with tags and taxonomy concepts
 */
export const AssetMetadataSchema = z
  .object({
    tags: z.array(
      z.object({
        sys: z.object({
          type: z.literal('Link'),
          linkType: z.literal('Tag'),
          id: z.string(),
        }),
      }),
    ),
    concepts: z
      .array(
        z.object({
          sys: z.object({
            type: z.literal('Link'),
            linkType: z.literal('TaxonomyConcept'),
            id: z.string(),
          }),
        }),
      )
      .optional(),
  })
  .optional();
