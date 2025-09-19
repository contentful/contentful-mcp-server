import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { createToolClient } from '../../../utils/tools.js';

/**
 * Schema for taxonomy concept link validation
 * Used for broader and related concept relationships
 */
const TaxonomyConceptLinkSchema = z.object({
  sys: z.object({
    type: z.literal('Link'),
    linkType: z.literal('TaxonomyConcept'),
    id: z.string(),
  }),
});

export const UpdateConceptToolParams = z.object({
  organizationId: z.string().describe('The ID of the Contentful organization'),
  conceptId: z.string().describe('The ID of the concept to update'),
  version: z.number().describe('The current version of the concept'),
  prefLabel: z
    .record(z.string())
    .optional()
    .describe('The preferred label for the concept (localized)'),
  uri: z.string().nullable().optional().describe('The URI for the concept'),
  altLabels: z
    .record(z.array(z.string()))
    .optional()
    .describe('Alternative labels for the concept (localized)'),
  hiddenLabels: z
    .record(z.array(z.string()))
    .optional()
    .describe('Hidden labels for the concept (localized)'),
  definition: z
    .record(z.string().nullable())
    .optional()
    .describe('Definition of the concept (localized)'),
  editorialNote: z
    .record(z.string().nullable())
    .optional()
    .describe('Editorial note for the concept (localized)'),
  historyNote: z
    .record(z.string().nullable())
    .optional()
    .describe('History note for the concept (localized)'),
  example: z
    .record(z.string().nullable())
    .optional()
    .describe('Example for the concept (localized)'),
  note: z
    .record(z.string().nullable())
    .optional()
    .describe('General note for the concept (localized)'),
  scopeNote: z
    .record(z.string().nullable())
    .optional()
    .describe('Scope note for the concept (localized)'),
  notations: z
    .array(z.string())
    .optional()
    .describe('Notations for the concept'),
  broader: z
    .array(TaxonomyConceptLinkSchema)
    .optional()
    .describe('Links to broader concepts'),
  related: z
    .array(TaxonomyConceptLinkSchema)
    .optional()
    .describe('Links to related concepts'),
});

type Params = z.infer<typeof UpdateConceptToolParams>;

async function tool(args: Params) {
  const contentfulClient = createToolClient({
    spaceId: 'dummy', // Not needed for concept operations but required by BaseToolSchema
    environmentId: 'dummy', // Not needed for concept operations but required by BaseToolSchema
  });

  // First, get the existing concept
  const existingConcept = await contentfulClient.concept.get({
    organizationId: args.organizationId,
    conceptId: args.conceptId,
  });

  // Build the updated concept payload by merging existing data with provided updates
  const updatedPayload: Record<string, unknown> = {
    prefLabel: args.prefLabel || existingConcept.prefLabel,
  };

  // Handle URI - can be explicitly set to null, so check if it's provided
  if (args.uri !== undefined) {
    updatedPayload.uri = args.uri;
  } else {
    updatedPayload.uri = existingConcept.uri;
  }

  // Merge other optional fields
  if (args.altLabels !== undefined) {
    updatedPayload.altLabels = args.altLabels;
  } else {
    updatedPayload.altLabels = existingConcept.altLabels;
  }

  if (args.hiddenLabels !== undefined) {
    updatedPayload.hiddenLabels = args.hiddenLabels;
  } else {
    updatedPayload.hiddenLabels = existingConcept.hiddenLabels;
  }

  if (args.definition !== undefined) {
    updatedPayload.definition = args.definition;
  } else {
    updatedPayload.definition = existingConcept.definition;
  }

  if (args.editorialNote !== undefined) {
    updatedPayload.editorialNote = args.editorialNote;
  } else {
    updatedPayload.editorialNote = existingConcept.editorialNote;
  }

  if (args.historyNote !== undefined) {
    updatedPayload.historyNote = args.historyNote;
  } else {
    updatedPayload.historyNote = existingConcept.historyNote;
  }

  if (args.example !== undefined) {
    updatedPayload.example = args.example;
  } else {
    updatedPayload.example = existingConcept.example;
  }

  if (args.note !== undefined) {
    updatedPayload.note = args.note;
  } else {
    updatedPayload.note = existingConcept.note;
  }

  if (args.scopeNote !== undefined) {
    updatedPayload.scopeNote = args.scopeNote;
  } else {
    updatedPayload.scopeNote = existingConcept.scopeNote;
  }

  if (args.notations !== undefined) {
    updatedPayload.notations = args.notations;
  } else {
    updatedPayload.notations = existingConcept.notations;
  }

  if (args.broader !== undefined) {
    updatedPayload.broader = args.broader;
  } else {
    updatedPayload.broader = existingConcept.broader;
  }

  if (args.related !== undefined) {
    updatedPayload.related = args.related;
  } else {
    updatedPayload.related = existingConcept.related;
  }

  // Update the concept using the PUT method
  const updatedConcept = await contentfulClient.concept.updatePut(
    {
      organizationId: args.organizationId,
      conceptId: args.conceptId,
      version: args.version,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatedPayload as any,
  );

  return createSuccessResponse('Concept updated successfully', {
    updatedConcept,
  });
}

export const updateConceptTool = withErrorHandling(
  tool,
  'Error updating concept',
);
