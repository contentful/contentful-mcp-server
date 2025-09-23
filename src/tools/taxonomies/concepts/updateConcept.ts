import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { createToolClient } from '../../../utils/tools.js';
import {
  TaxonomyConceptLinkSchema,
  type ConceptPayload,
} from '../../../types/conceptPayloadTypes.js';

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
  const updatedPayload: ConceptPayload = {
    prefLabel: args.prefLabel ?? existingConcept.prefLabel,
    uri: args.uri !== undefined ? args.uri : existingConcept.uri,
    altLabels: args.altLabels ?? existingConcept.altLabels,
    hiddenLabels: args.hiddenLabels ?? existingConcept.hiddenLabels,
    definition: args.definition ?? existingConcept.definition,
    editorialNote: args.editorialNote ?? existingConcept.editorialNote,
    historyNote: args.historyNote ?? existingConcept.historyNote,
    example: args.example ?? existingConcept.example,
    note: args.note ?? existingConcept.note,
    scopeNote: args.scopeNote ?? existingConcept.scopeNote,
    notations: args.notations ?? existingConcept.notations,
    broader: args.broader ?? existingConcept.broader,
    related: args.related ?? existingConcept.related,
  };

  // Update the concept using the PUT method
  const updatedConcept = await contentfulClient.concept.updatePut(
    {
      organizationId: args.organizationId,
      conceptId: args.conceptId,
      version: args.version,
    },
    updatedPayload,
  );

  return createSuccessResponse('Concept updated successfully', {
    updatedConcept,
  });
}

export const updateConceptTool = withErrorHandling(
  tool,
  'Error updating concept',
);
