import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import ctfl from 'contentful-management';
import { getDefaultClientConfig } from '../../../config/contentful.js';
import { TaxonomyConceptLinkSchema } from '../../../types/conceptPayloadTypes.js';

export const UpdateConceptSchemeToolParams = z.object({
  organizationId: z.string().describe('The ID of the Contentful organization'),
  conceptSchemeId: z
    .string()
    .describe('The ID of the concept scheme to update'),
  version: z.number().describe('The current version of the concept scheme'),
  prefLabel: z
    .record(z.string())
    .optional()
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

type Params = z.infer<typeof UpdateConceptSchemeToolParams>;

async function tool(args: Params) {
  // Create a client without space-specific configuration for concept scheme operations
  const clientConfig = getDefaultClientConfig();
  // Remove space from config since we're working at the organization level
  delete clientConfig.space;
  const contentfulClient = ctfl.createClient(clientConfig, { type: 'plain' });

  const params = {
    organizationId: args.organizationId,
    conceptSchemeId: args.conceptSchemeId,
  };

  // Build JSON Patch operations for the fields that were provided
  const fieldMappings = {
    prefLabel: '/prefLabel',
    definition: '/definition',
    editorialNote: '/editorialNote',
    historyNote: '/historyNote',
    example: '/example',
    note: '/note',
    scopeNote: '/scopeNote',
    topConcepts: '/topConcepts',
  } as const;

  const patchOperations: Array<{
    op: string;
    path: string;
    value?: unknown;
  }> = [];

  // Handle regular fields with replace operation
  Object.entries(fieldMappings).forEach(([field, path]) => {
    const value = args[field as keyof typeof fieldMappings];
    if (value !== undefined) {
      patchOperations.push({
        op: 'replace',
        path,
        value,
      });
    }
  });

  // Handle URI field specially (can be removed when null)
  if (args.uri !== undefined) {
    patchOperations.push({
      op: args.uri === null ? 'remove' : 'replace',
      path: '/uri',
      ...(args.uri !== null && { value: args.uri }),
    });
  }

  // Update the concept scheme using JSON Patch
  const updatedConceptScheme = await contentfulClient.conceptScheme.update(
    {
      ...params,
      version: args.version,
    },
    patchOperations,
  );

  return createSuccessResponse('Concept scheme updated successfully', {
    updatedConceptScheme,
  });
}

export const updateConceptSchemeTool = withErrorHandling(
  tool,
  'Error updating concept scheme',
);
