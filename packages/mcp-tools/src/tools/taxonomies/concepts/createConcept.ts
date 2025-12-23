import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import * as ctfl from 'contentful-management';
import { createClientConfig } from '../../../utils/tools.js';
import {
  TaxonomyConceptLinkSchema,
  type ConceptPayload,
} from '../../../types/conceptPayloadTypes.js';
import type { ContentfulConfig } from '../../../config/types.js';

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

export function createConceptTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    // Create a client without space-specific configuration for concept operations
    const clientConfig = createClientConfig(config);
    // Remove space from config since we're working at the organization level
    delete clientConfig.space;
    const contentfulClient = ctfl.createClient(clientConfig, { type: 'plain' });

  // Build the concept payload using the shared type
  const conceptPayload: ConceptPayload = {
    prefLabel: args.prefLabel,
    ...(args.uri !== undefined && { uri: args.uri }),
    ...(args.altLabels && { altLabels: args.altLabels }),
    ...(args.hiddenLabels && { hiddenLabels: args.hiddenLabels }),
    ...(args.definition && { definition: args.definition }),
    ...(args.editorialNote && { editorialNote: args.editorialNote }),
    ...(args.historyNote && { historyNote: args.historyNote }),
    ...(args.example && { example: args.example }),
    ...(args.note && { note: args.note }),
    ...(args.scopeNote && { scopeNote: args.scopeNote }),
    ...(args.notations && { notations: args.notations }),
    ...(args.broader && { broader: args.broader }),
    ...(args.related && { related: args.related }),
  };

  const newConcept = args.conceptId
    ? await contentfulClient.concept.createWithId(
        { organizationId: args.organizationId, conceptId: args.conceptId },
        conceptPayload,
      )
    : await contentfulClient.concept.create(
        { organizationId: args.organizationId },
        conceptPayload,
      );

    return createSuccessResponse('Concept created successfully', { newConcept });
  }

  return withErrorHandling(tool, 'Error creating concept');
}
