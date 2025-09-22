import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { createToolClient } from '../../../utils/tools.js';
import {
  ConceptSchemePayload,
  TaxonomyConceptLinkSchema,
} from '../../../types/conceptPayloadTypes.js';

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
  const conceptSchemePayload: ConceptSchemePayload = {
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
        conceptSchemePayload,
      )
    : await contentfulClient.conceptScheme.create(
        { organizationId: args.organizationId },
        conceptSchemePayload,
      );

  return createSuccessResponse('Concept scheme created successfully', {
    newConceptScheme,
  });
}

export const createConceptSchemeTool = withErrorHandling(
  tool,
  'Error creating concept scheme',
);
