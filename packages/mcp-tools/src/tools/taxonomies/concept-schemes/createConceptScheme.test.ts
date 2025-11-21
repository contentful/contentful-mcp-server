import { describe, it, expect, beforeEach } from 'vitest';
import {
  testConceptScheme,
  mockConceptSchemeCreate,
  mockConceptSchemeCreateWithId,
  mockCreateClient,
} from './mockClient.js';
import { createConceptSchemeTool } from './createConceptScheme.js';
import { createClientConfig } from '../../../utils/tools.js';
import { formatResponse } from '../../../utils/formatters.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('createConceptScheme', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    mockConceptSchemeCreate.mockClear();
    mockConceptSchemeCreateWithId.mockClear();
  });

  const testArgs = {
    organizationId: 'test-org-id',
    prefLabel: {
      'en-US': 'Test Concept Scheme',
    },
  };

  it('should create a concept scheme successfully with minimal required fields', async () => {
    mockConceptSchemeCreate.mockResolvedValue(testConceptScheme);

    const tool = createConceptSchemeTool(mockConfig);
    const result = await tool(testArgs);

    const clientConfig = createClientConfig(mockConfig);
    expect(mockCreateClient).toHaveBeenCalledWith(clientConfig, {
      type: 'plain',
    });
    expect(mockConceptSchemeCreate).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
      },
      {
        prefLabel: {
          'en-US': 'Test Concept Scheme',
        },
      },
    );

    const expectedResponse = formatResponse(
      'Concept scheme created successfully',
      {
        newConceptScheme: testConceptScheme,
      },
    );
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });
  });

  it('should create a concept scheme with user-defined ID', async () => {
    const argsWithId = {
      ...testArgs,
      conceptSchemeId: 'custom-scheme-id',
    };
    mockConceptSchemeCreateWithId.mockResolvedValue(testConceptScheme);

    const tool = createConceptSchemeTool(mockConfig);
    const result = await tool(argsWithId);

    expect(mockConceptSchemeCreateWithId).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
        conceptSchemeId: 'custom-scheme-id',
      },
      {
        prefLabel: {
          'en-US': 'Test Concept Scheme',
        },
      },
    );

    const expectedResponse = formatResponse(
      'Concept scheme created successfully',
      {
        newConceptScheme: testConceptScheme,
      },
    );
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });
  });

  it('should create a concept scheme with all optional fields', async () => {
    const fullArgs = {
      organizationId: 'test-org-id',
      prefLabel: {
        'en-US': 'Test Concept Scheme',
        'de-DE': 'Test-Konzeptschema',
      },
      uri: 'https://example.com/schemes/test',
      definition: {
        'en-US': 'A test concept scheme for validation',
      },
      editorialNote: {
        'en-US': 'Editorial note for testing',
      },
      historyNote: {
        'en-US': 'History note for testing',
      },
      example: {
        'en-US': 'Example usage',
      },
      note: {
        'en-US': 'General note',
      },
      scopeNote: {
        'en-US': 'Scope note for testing',
      },
      topConcepts: [
        {
          sys: {
            type: 'Link' as const,
            linkType: 'TaxonomyConcept' as const,
            id: 'concept-1',
          },
        },
        {
          sys: {
            type: 'Link' as const,
            linkType: 'TaxonomyConcept' as const,
            id: 'concept-2',
          },
        },
      ],
    };

    mockConceptSchemeCreate.mockResolvedValue(testConceptScheme);

    const tool = createConceptSchemeTool(mockConfig);
    const result = await tool(fullArgs);

    expect(mockConceptSchemeCreate).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
      },
      {
        prefLabel: {
          'en-US': 'Test Concept Scheme',
          'de-DE': 'Test-Konzeptschema',
        },
        uri: 'https://example.com/schemes/test',
        definition: {
          'en-US': 'A test concept scheme for validation',
        },
        editorialNote: {
          'en-US': 'Editorial note for testing',
        },
        historyNote: {
          'en-US': 'History note for testing',
        },
        example: {
          'en-US': 'Example usage',
        },
        note: {
          'en-US': 'General note',
        },
        scopeNote: {
          'en-US': 'Scope note for testing',
        },
        topConcepts: [
          {
            sys: {
              type: 'Link',
              linkType: 'TaxonomyConcept',
              id: 'concept-1',
            },
          },
          {
            sys: {
              type: 'Link',
              linkType: 'TaxonomyConcept',
              id: 'concept-2',
            },
          },
        ],
      },
    );

    const expectedResponse = formatResponse(
      'Concept scheme created successfully',
      {
        newConceptScheme: testConceptScheme,
      },
    );
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Failed to create concept scheme';
    mockConceptSchemeCreate.mockRejectedValue(new Error(errorMessage));

    const tool = createConceptSchemeTool(mockConfig);
    const result = await tool(testArgs);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: `Error creating concept scheme: ${errorMessage}`,
        },
      ],
      isError: true,
    });
  });
});
