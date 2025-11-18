import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import ctfl from 'contentful-management';
import { getDefaultClientConfig } from '../../../config/contentful.js';
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
  // Create a client without space-specific configuration for concept scheme operations
  const clientConfig = getDefaultClientConfig();
  // Remove space from config since we're working at the organization level
  delete clientConfig.space;
  const contentfulClient = ctfl.createClient(clientConfig, { type: 'plain' });

  // Build the concept scheme payload by filtering out undefined values
  const conceptSchemePayload: ConceptSchemePayload = {
    prefLabel: args.prefLabel,
    ...Object.fromEntries(
      Object.entries({
        uri: args.uri,
        definition: args.definition,
        editorialNote: args.editorialNote,
        historyNote: args.historyNote,
        example: args.example,
        note: args.note,
        scopeNote: args.scopeNote,
        topConcepts: args.topConcepts,
      }).filter(([, value]) => value !== undefined),
    ),
  };

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
