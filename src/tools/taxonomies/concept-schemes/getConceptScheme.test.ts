import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getConceptSchemeTool } from './getConceptScheme.js';
import { createToolClient } from '../../../utils/tools.js';
import { formatResponse } from '../../../utils/formatters.js';

const { mockConceptSchemeGet, mockCreateToolClient } = vi.hoisted(() => {
  return {
    mockConceptSchemeGet: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        conceptScheme: {
          get: mockConceptSchemeGet,
        },
      };
    }),
  };
});

vi.mock('../../../utils/tools.js', async (importOriginal) => {
  const org = await importOriginal<typeof import('../../../utils/tools.js')>();
  return {
    ...org,
    createToolClient: mockCreateToolClient,
  };
});

const testConceptScheme = {
  sys: {
    type: 'TaxonomyConceptScheme',
    id: 'test-concept-scheme-id',
    version: 1,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    createdBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: 'user-id',
      },
    },
    updatedBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: 'user-id',
      },
    },
  },
  prefLabel: {
    'en-US': 'Test Concept Scheme',
  },
  uri: null,
  definition: null,
  editorialNote: null,
  historyNote: null,
  example: null,
  note: null,
  scopeNote: null,
  topConcepts: [],
};

describe('getConceptScheme', () => {
  beforeEach(() => {
    mockConceptSchemeGet.mockClear();
  });

  const testArgs = {
    organizationId: 'test-org-id',
    conceptSchemeId: 'test-concept-scheme-id',
  };

  it('should retrieve a concept scheme successfully', async () => {
    mockConceptSchemeGet.mockResolvedValue(testConceptScheme);

    const result = await getConceptSchemeTool(testArgs);

    expect(createToolClient).toHaveBeenCalledWith({
      spaceId: 'dummy',
      environmentId: 'dummy',
    });

    expect(mockConceptSchemeGet).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptSchemeId: 'test-concept-scheme-id',
    });

    const expectedResponse = formatResponse(
      'Concept scheme retrieved successfully',
      {
        conceptScheme: testConceptScheme,
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

  it('should handle errors properly', async () => {
    const error = new Error('Test error');
    mockConceptSchemeGet.mockRejectedValue(error);

    const result = await getConceptSchemeTool(testArgs);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Error retrieving concept scheme: Test error',
        },
      ],
      isError: true,
    });
  });

  it('should retrieve a concept scheme with complex data', async () => {
    const complexConceptScheme = {
      ...testConceptScheme,
      prefLabel: {
        'en-US': 'Complex Concept Scheme',
        'de-DE': 'Komplexes Konzept-Schema',
      },
      uri: 'https://example.com/complex-scheme',
      definition: {
        'en-US': 'A complex concept scheme for testing',
        'de-DE': 'Ein komplexes Konzept-Schema zum Testen',
      },
      editorialNote: {
        'en-US': 'Editorial note for complex scheme',
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
    };

    mockConceptSchemeGet.mockResolvedValue(complexConceptScheme);

    const result = await getConceptSchemeTool(testArgs);

    expect(mockConceptSchemeGet).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptSchemeId: 'test-concept-scheme-id',
    });

    const expectedResponse = formatResponse(
      'Concept scheme retrieved successfully',
      {
        conceptScheme: complexConceptScheme,
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
});
