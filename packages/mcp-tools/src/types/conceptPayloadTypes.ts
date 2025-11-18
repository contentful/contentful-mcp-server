/**
 * Shared type definitions for taxonomy concept and concept scheme payloads
 * Used across create, update, and other taxonomy operations
 */

import { z } from 'zod';

/**
 * Schema for taxonomy concept link validation
 * Used for broader and related concept relationships
 */
export const TaxonomyConceptLinkSchema = z.object({
  sys: z.object({
    type: z.literal('Link'),
    linkType: z.literal('TaxonomyConcept'),
    id: z.string(),
  }),
});

/**
 * Interface for taxonomy concept link
 * Used in broader and related concept relationships
 */
export interface TaxonomyConceptLink {
  sys: {
    type: 'Link';
    linkType: 'TaxonomyConcept';
    id: string;
  };
}

/**
 * Base interface for concept payload containing all possible concept fields
 * Used for both creation and update operations
 */
export interface ConceptPayload {
  prefLabel: Record<string, string>;
  uri?: string | null;
  altLabels?: Record<string, string[]>;
  hiddenLabels?: Record<string, string[]>;
  definition?: Record<string, string | null>;
  editorialNote?: Record<string, string | null>;
  historyNote?: Record<string, string | null>;
  example?: Record<string, string | null>;
  note?: Record<string, string | null>;
  scopeNote?: Record<string, string | null>;
  notations?: string[];
  broader?: TaxonomyConceptLink[];
  related?: TaxonomyConceptLink[];
}

/**
 * Interface for concept scheme payload
 * Used for concept scheme creation operations
 */
export interface ConceptSchemePayload {
  prefLabel: Record<string, string>;
  uri?: string | null;
  definition?: Record<string, string | null>;
  editorialNote?: Record<string, string | null>;
  historyNote?: Record<string, string | null>;
  example?: Record<string, string | null>;
  note?: Record<string, string | null>;
  scopeNote?: Record<string, string | null>;
  topConcepts?: TaxonomyConceptLink[];
}
