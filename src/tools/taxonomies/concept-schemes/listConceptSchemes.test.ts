import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listConceptSchemesTool } from './listConceptSchemes.js';
import { createToolClient } from '../../../utils/tools.js';

const { mockConceptSchemeGetMany, mockCreateToolClient } = vi.hoisted(() => {
  return {
    mockConceptSchemeGetMany: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        conceptScheme: {
          getMany: mockConceptSchemeGetMany,
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

const testConceptScheme1 = {
  sys: {
    type: 'TaxonomyConceptScheme',
    id: 'concept-scheme-1',
    version: 1,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  prefLabel: {
    'en-US': 'First Concept Scheme',
  },
  uri: null,
  definition: {
    'en-US': 'First concept scheme for testing',
  },
  topConcepts: [],
};

const testConceptScheme2 = {
  sys: {
    type: 'TaxonomyConceptScheme',
    id: 'concept-scheme-2',
    version: 2,
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
  },
  prefLabel: {
    'en-US': 'Second Concept Scheme',
  },
  uri: 'https://example.com/second-scheme',
  definition: null,
  topConcepts: [
    {
      sys: {
        type: 'Link',
        linkType: 'TaxonomyConcept',
        id: 'concept-1',
      },
    },
  ],
};

const mockConceptSchemesResponse = {
  sys: {
    type: 'Array',
  },
  total: 2,
  skip: 0,
  limit: 10,
  items: [testConceptScheme1, testConceptScheme2],
};

describe('listConceptSchemes', () => {
  beforeEach(() => {
    mockConceptSchemeGetMany.mockClear();
  });

  const testArgs = {
    organizationId: 'test-org-id',
  };

  it('should list concept schemes successfully with default parameters', async () => {
    mockConceptSchemeGetMany.mockResolvedValue(mockConceptSchemesResponse);

    const result = await listConceptSchemesTool(testArgs);

    expect(createToolClient).toHaveBeenCalledWith({
      spaceId: 'dummy',
      environmentId: 'dummy',
    });

    expect(mockConceptSchemeGetMany).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      query: {
        limit: 10,
        skip: 0,
      },
    });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain(
      'Concept schemes retrieved successfully',
    );
    expect(result.content[0].text).toContain('First Concept Scheme');
    expect(result.content[0].text).toContain('Second Concept Scheme');
  });

  it('should list concept schemes with custom pagination', async () => {
    const customResponse = {
      ...mockConceptSchemesResponse,
      skip: 5,
      limit: 3,
    };
    mockConceptSchemeGetMany.mockResolvedValue(customResponse);

    const result = await listConceptSchemesTool({
      ...testArgs,
      limit: 3,
      skip: 5,
    });

    expect(mockConceptSchemeGetMany).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      query: {
        limit: 3,
        skip: 5,
      },
    });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain(
      'Concept schemes retrieved successfully',
    );
  });

  it('should list concept schemes with query parameters', async () => {
    mockConceptSchemeGetMany.mockResolvedValue(mockConceptSchemesResponse);

    const result = await listConceptSchemesTool({
      ...testArgs,
      select: 'sys.id,prefLabel',
      order: 'sys.createdAt',
      include: 1,
    });

    expect(mockConceptSchemeGetMany).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      query: {
        limit: 10,
        skip: 0,
        select: 'sys.id,prefLabel',
        order: 'sys.createdAt',
        include: 1,
      },
    });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain(
      'Concept schemes retrieved successfully',
    );
  });

  it('should handle empty results', async () => {
    const emptyResponse = {
      sys: {
        type: 'Array',
      },
      total: 0,
      skip: 0,
      limit: 10,
      items: [],
    };
    mockConceptSchemeGetMany.mockResolvedValue(emptyResponse);

    const result = await listConceptSchemesTool(testArgs);

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain(
      'Concept schemes retrieved successfully',
    );
    expect(result.content[0].text).toContain('<total>0</total>');
  });

  it('should handle errors properly', async () => {
    const error = new Error('Test error');
    mockConceptSchemeGetMany.mockRejectedValue(error);

    const result = await listConceptSchemesTool(testArgs);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Error listing concept schemes: Test error',
        },
      ],
      isError: true,
    });
  });

  it('should summarize concept schemes correctly', async () => {
    mockConceptSchemeGetMany.mockResolvedValue(mockConceptSchemesResponse);

    const result = await listConceptSchemesTool(testArgs);

    const responseText = result.content[0].text;

    // Check that summarized fields are included
    expect(responseText).toContain('concept-scheme-1');
    expect(responseText).toContain('concept-scheme-2');
    expect(responseText).toContain('First Concept Scheme');
    expect(responseText).toContain('Second Concept Scheme');
    expect(responseText).toContain('2023-01-01T00:00:00Z');
    expect(responseText).toContain('2023-01-02T00:00:00Z');
  });

  it('should include pagination information in response', async () => {
    mockConceptSchemeGetMany.mockResolvedValue(mockConceptSchemesResponse);

    const result = await listConceptSchemesTool(testArgs);

    const responseText = result.content[0].text;
    expect(responseText).toContain('<total>2</total>');
    expect(responseText).toContain('<limit>10</limit>');
    expect(responseText).toContain('<skip>0</skip>');
  });
});
