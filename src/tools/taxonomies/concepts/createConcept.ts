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

export const CreateConceptToolParams = z.object({
  organizationId: z.string().describe('The ID of the Contentful organization'),
  conceptId: z
    .string()
    .optional()
    .describe(
      'Optional user-defined ID for the concept. If not provided, Contentful will generate one automatically.',
    ),
  prefLabel: z
    .record(z.string())
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

type Params = z.infer<typeof CreateConceptToolParams>;

async function tool(args: Params) {
  const contentfulClient = createToolClient({
    spaceId: 'dummy', // Not needed for concept creation but required by BaseToolSchema
    environmentId: 'dummy', // Not needed for concept creation but required by BaseToolSchema
  });

  // Build the concept payload
  const conceptPayload: Record<string, unknown> = {
    prefLabel: args.prefLabel,
  };

  if (args.uri !== undefined) {
    conceptPayload.uri = args.uri;
  }
  if (args.altLabels) {
    conceptPayload.altLabels = args.altLabels;
  }
  if (args.hiddenLabels) {
    conceptPayload.hiddenLabels = args.hiddenLabels;
  }
  if (args.definition) {
    conceptPayload.definition = args.definition;
  }
  if (args.editorialNote) {
    conceptPayload.editorialNote = args.editorialNote;
  }
  if (args.historyNote) {
    conceptPayload.historyNote = args.historyNote;
  }
  if (args.example) {
    conceptPayload.example = args.example;
  }
  if (args.note) {
    conceptPayload.note = args.note;
  }
  if (args.scopeNote) {
    conceptPayload.scopeNote = args.scopeNote;
  }
  if (args.notations) {
    conceptPayload.notations = args.notations;
  }
  if (args.broader) {
    conceptPayload.broader = args.broader;
  }
  if (args.related) {
    conceptPayload.related = args.related;
  }

  const newConcept = args.conceptId
    ? await contentfulClient.concept.createWithId(
        { organizationId: args.organizationId, conceptId: args.conceptId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        conceptPayload as any,
      )
    : await contentfulClient.concept.create(
        { organizationId: args.organizationId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        conceptPayload as any,
      );

  return createSuccessResponse('Concept created successfully', { newConcept });
}

export const createConceptTool = withErrorHandling(
  tool,
  'Error creating concept',
);
