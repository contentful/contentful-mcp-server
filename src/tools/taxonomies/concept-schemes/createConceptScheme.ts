import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { createToolClient } from '../../../utils/tools.js';

/**
 * Schema for taxonomy concept scheme link validation
 * Used for topConcept relationships
 */
const TaxonomyConceptLinkSchema = z.object({
  sys: z.object({
    type: z.literal('Link'),
    linkType: z.literal('TaxonomyConcept'),
    id: z.string(),
  }),
});

export const CreateConceptSchemeToolParams = z.object({
  organizationId: z.string().describe('The ID of the Contentful organization'),
  conceptSchemeId: z
    .string()
    .optional()
    .describe(
      'Optional user-defined ID for the concept scheme. If not provided, Contentful will generate one automatically.',
    ),
  prefLabel: z
    .record(z.string())
    .describe('The preferred label for the concept scheme (localized)'),
  uri: z
    .string()
    .nullable()
    .optional()
    .describe('The URI for the concept scheme'),
  definition: z
    .record(z.string().nullable())
    .optional()
    .describe('Definition of the concept scheme (localized)'),
  editorialNote: z
    .record(z.string().nullable())
    .optional()
    .describe('Editorial note for the concept scheme (localized)'),
  historyNote: z
    .record(z.string().nullable())
    .optional()
    .describe('History note for the concept scheme (localized)'),
  example: z
    .record(z.string().nullable())
    .optional()
    .describe('Example for the concept scheme (localized)'),
  note: z
    .record(z.string().nullable())
    .optional()
    .describe('General note for the concept scheme (localized)'),
  scopeNote: z
    .record(z.string().nullable())
    .optional()
    .describe('Scope note for the concept scheme (localized)'),
  topConcepts: z
    .array(TaxonomyConceptLinkSchema)
    .optional()
    .describe('Links to top-level concepts in this scheme'),
});

type Params = z.infer<typeof CreateConceptSchemeToolParams>;

async function tool(args: Params) {
  const contentfulClient = createToolClient({
    spaceId: 'dummy', // Not needed for concept scheme creation but required by BaseToolSchema
    environmentId: 'dummy', // Not needed for concept scheme creation but required by BaseToolSchema
  });

  // Build the concept scheme payload
  const conceptSchemePayload: Record<string, unknown> = {
    prefLabel: args.prefLabel,
  };

  if (args.uri !== undefined) {
    conceptSchemePayload.uri = args.uri;
  }
  if (args.definition) {
    conceptSchemePayload.definition = args.definition;
  }
  if (args.editorialNote) {
    conceptSchemePayload.editorialNote = args.editorialNote;
  }
  if (args.historyNote) {
    conceptSchemePayload.historyNote = args.historyNote;
  }
  if (args.example) {
    conceptSchemePayload.example = args.example;
  }
  if (args.note) {
    conceptSchemePayload.note = args.note;
  }
  if (args.scopeNote) {
    conceptSchemePayload.scopeNote = args.scopeNote;
  }
  if (args.topConcepts) {
    conceptSchemePayload.topConcepts = args.topConcepts;
  }

  const newConceptScheme = args.conceptSchemeId
    ? await contentfulClient.conceptScheme.createWithId(
        {
          organizationId: args.organizationId,
          conceptSchemeId: args.conceptSchemeId,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        conceptSchemePayload as any,
      )
    : await contentfulClient.conceptScheme.create(
        { organizationId: args.organizationId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        conceptSchemePayload as any,
      );

  return createSuccessResponse('Concept scheme created successfully', {
    newConceptScheme,
  });
}

export const createConceptSchemeTool = withErrorHandling(
  tool,
  'Error creating concept scheme',
);
