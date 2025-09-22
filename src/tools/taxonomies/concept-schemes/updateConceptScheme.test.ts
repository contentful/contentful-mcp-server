import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateConceptSchemeTool } from './updateConceptScheme.js';
import { createToolClient } from '../../../utils/tools.js';
import { formatResponse } from '../../../utils/formatters.js';

const { mockConceptSchemeUpdate, mockCreateToolClient } = vi.hoisted(() => {
  return {
    mockConceptSchemeUpdate: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        conceptScheme: {
          update: mockConceptSchemeUpdate,
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

const updatedConceptScheme = {
  ...testConceptScheme,
  sys: {
    ...testConceptScheme.sys,
    version: 2,
    updatedAt: '2023-01-02T00:00:00Z',
  },
  prefLabel: {
    'en-US': 'Updated Test Concept Scheme',
  },
  definition: {
    'en-US': 'Updated definition',
  },
};

describe('updateConceptScheme', () => {
  beforeEach(() => {
    mockConceptSchemeUpdate.mockClear();
  });

  const testArgs = {
    organizationId: 'test-org-id',
    conceptSchemeId: 'test-concept-scheme-id',
    version: 1,
  };

  it('should update a concept scheme successfully with only prefLabel', async () => {
    mockConceptSchemeUpdate.mockResolvedValue(updatedConceptScheme);

    const result = await updateConceptSchemeTool({
      ...testArgs,
      prefLabel: {
        'en-US': 'Updated Test Concept Scheme',
      },
    });

    expect(createToolClient).toHaveBeenCalledWith({
      spaceId: 'dummy',
      environmentId: 'dummy',
    });

    expect(mockConceptSchemeUpdate).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
        conceptSchemeId: 'test-concept-scheme-id',
        version: 1,
      },
      [
        {
          op: 'replace',
          path: '/prefLabel',
          value: {
            'en-US': 'Updated Test Concept Scheme',
          },
        },
      ],
    );

    const expectedResponse = formatResponse(
      'Concept scheme updated successfully',
      {
        updatedConceptScheme,
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

  it('should update a concept scheme successfully with multiple fields', async () => {
    mockConceptSchemeUpdate.mockResolvedValue(updatedConceptScheme);

    const result = await updateConceptSchemeTool({
      ...testArgs,
      prefLabel: {
        'en-US': 'Updated Test Concept Scheme',
      },
      definition: {
        'en-US': 'Updated definition',
      },
      uri: 'https://example.com/updated-scheme',
      editorialNote: {
        'en-US': 'Updated editorial note',
      },
    });

    expect(mockConceptSchemeUpdate).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
        conceptSchemeId: 'test-concept-scheme-id',
        version: 1,
      },
      [
        {
          op: 'replace',
          path: '/prefLabel',
          value: {
            'en-US': 'Updated Test Concept Scheme',
          },
        },
        {
          op: 'replace',
          path: '/definition',
          value: {
            'en-US': 'Updated definition',
          },
        },
        {
          op: 'replace',
          path: '/editorialNote',
          value: {
            'en-US': 'Updated editorial note',
          },
        },
        {
          op: 'replace',
          path: '/uri',
          value: 'https://example.com/updated-scheme',
        },
      ],
    );

    const expectedResponse = formatResponse(
      'Concept scheme updated successfully',
      {
        updatedConceptScheme,
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

  it('should update a concept scheme successfully with topConcepts', async () => {
    mockConceptSchemeUpdate.mockResolvedValue(updatedConceptScheme);

    const topConcepts = [
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
    ];

    const result = await updateConceptSchemeTool({
      ...testArgs,
      topConcepts,
    });

    expect(mockConceptSchemeUpdate).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
        conceptSchemeId: 'test-concept-scheme-id',
        version: 1,
      },
      [
        {
          op: 'replace',
          path: '/topConcepts',
          value: topConcepts,
        },
      ],
    );

    const expectedResponse = formatResponse(
      'Concept scheme updated successfully',
      {
        updatedConceptScheme,
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

  it('should handle null values for optional fields', async () => {
    mockConceptSchemeUpdate.mockResolvedValue(updatedConceptScheme);

    const result = await updateConceptSchemeTool({
      ...testArgs,
      uri: null,
      definition: {
        'en-US': null,
      },
    });

    expect(mockConceptSchemeUpdate).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
        conceptSchemeId: 'test-concept-scheme-id',
        version: 1,
      },
      [
        {
          op: 'replace',
          path: '/definition',
          value: {
            'en-US': null,
          },
        },
        {
          op: 'remove',
          path: '/uri',
        },
      ],
    );

    const expectedResponse = formatResponse(
      'Concept scheme updated successfully',
      {
        updatedConceptScheme,
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

  it('should update concept scheme with minimal fields (only version)', async () => {
    mockConceptSchemeUpdate.mockResolvedValue(testConceptScheme);

    const result = await updateConceptSchemeTool(testArgs);

    expect(mockConceptSchemeUpdate).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
        conceptSchemeId: 'test-concept-scheme-id',
        version: 1,
      },
      [],
    );

    const expectedResponse = formatResponse(
      'Concept scheme updated successfully',
      {
        updatedConceptScheme: testConceptScheme,
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
    mockConceptSchemeUpdate.mockRejectedValue(error);

    const result = await updateConceptSchemeTool(testArgs);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Error updating concept scheme: Test error',
        },
      ],
      isError: true,
    });
  });
});
