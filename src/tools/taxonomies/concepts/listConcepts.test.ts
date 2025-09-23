import { describe, it, expect, beforeEach } from 'vitest';
import {
  mockArgs,
  testConcept,
  mockConceptGetMany,
  mockConceptGetDescendants,
  mockConceptGetAncestors,
  mockConceptGetTotal,
} from './mockClient.js';
import { listConceptsTool } from './listConcepts.js';
import { createToolClient } from '../../../utils/tools.js';

describe('listConcepts', () => {
  beforeEach(() => {
    mockConceptGetMany.mockClear();
    mockConceptGetDescendants.mockClear();
    mockConceptGetAncestors.mockClear();
    mockConceptGetTotal.mockClear();
  });

  const testArgs = {
    organizationId: 'test-org-id',
  };

  const mockConceptsResponse = {
    items: [testConcept],
    total: 1,
    skip: 0,
    limit: 10,
  };

  it('should list concepts successfully with default parameters', async () => {
    mockConceptGetMany.mockResolvedValue(mockConceptsResponse);

    const result = await listConceptsTool(testArgs);

    expect(createToolClient).toHaveBeenCalledWith({
      spaceId: 'dummy',
      environmentId: 'dummy',
    });
    expect(mockConceptGetMany).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      query: {
        limit: 10,
        skip: 0,
      },
    });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Concepts retrieved successfully');
    expect(result.content[0].text).toContain('test-concept-id');
    expect(result.content[0].text).toContain('Test Concept');
  });

  it('should list concepts with custom pagination parameters', async () => {
    const customArgs = {
      organizationId: 'test-org-id',
      limit: 5,
      skip: 10,
    };

    mockConceptGetMany.mockResolvedValue({
      ...mockConceptsResponse,
      limit: 5,
      skip: 10,
    });

    const result = await listConceptsTool(customArgs);

    expect(mockConceptGetMany).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      query: {
        limit: 5,
        skip: 10,
      },
    });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Concepts retrieved successfully');
  });

  it('should list concepts with all optional parameters', async () => {
    const fullArgs = {
      organizationId: 'test-org-id',
      limit: 20,
      skip: 5,
      select: 'sys,prefLabel,uri',
      include: 2,
      order: 'sys.createdAt',
    };

    mockConceptGetMany.mockResolvedValue(mockConceptsResponse);

    const result = await listConceptsTool(fullArgs);

    expect(mockConceptGetMany).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      query: {
        limit: 20,
        skip: 5,
        select: 'sys,prefLabel,uri',
        include: 2,
        order: 'sys.createdAt',
      },
    });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Concepts retrieved successfully');
  });

  it('should handle empty results', async () => {
    const emptyResponse = {
      items: [],
      total: 0,
      skip: 0,
      limit: 10,
    };

    mockConceptGetMany.mockResolvedValue(emptyResponse);

    const result = await listConceptsTool(testArgs);

    expect(mockConceptGetMany).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      query: {
        limit: 10,
        skip: 0,
      },
    });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Concepts retrieved successfully');
  });

  it('should handle errors when listing concepts', async () => {
    const error = new Error('Failed to fetch concepts');
    mockConceptGetMany.mockRejectedValue(error);

    const result = await listConceptsTool(testArgs);

    expect(mockConceptGetMany).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      query: {
        limit: 10,
        skip: 0,
      },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error retrieving concepts');
    expect(result.content[0].text).toContain('Failed to fetch concepts');
  });

  it('should handle multiple concepts in response', async () => {
    const multipleConcepts = {
      items: [
        testConcept,
        {
          ...testConcept,
          sys: {
            ...testConcept.sys,
            id: 'test-concept-id-2',
          },
          prefLabel: {
            'en-US': 'Test Concept 2',
          },
        },
      ],
      total: 2,
      skip: 0,
      limit: 10,
    };

    mockConceptGetMany.mockResolvedValue(multipleConcepts);

    const result = await listConceptsTool(testArgs);

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Concepts retrieved successfully');
    expect(result.content[0].text).toContain('test-concept-id');
    expect(result.content[0].text).toContain('test-concept-id-2');
    expect(result.content[0].text).toContain('total>2</total>');
  });

  it('should get total count only when getTotalOnly is true', async () => {
    const totalOnlyArgs = {
      organizationId: 'test-org-id',
      getTotalOnly: true,
    };

    mockConceptGetTotal.mockResolvedValue(42);

    const result = await listConceptsTool(totalOnlyArgs);

    expect(mockConceptGetTotal).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
    });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain(
      'Total concepts retrieved successfully',
    );
    expect(result.content[0].text).toContain('42');
  });

  it('should get descendants when getDescendants is true', async () => {
    const descendantsArgs = {
      organizationId: 'test-org-id',
      conceptId: 'parent-concept-id',
      getDescendants: true,
    };

    const mockDescendantsResponse = {
      items: [testConcept],
      total: 1,
      skip: 0,
      limit: 10,
    };

    mockConceptGetDescendants.mockResolvedValue(mockDescendantsResponse);

    const result = await listConceptsTool(descendantsArgs);

    expect(mockConceptGetDescendants).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptId: 'parent-concept-id',
    });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain(
      'Concept descendants retrieved successfully',
    );
    expect(result.content[0].text).toContain('test-concept-id');
  });

  it('should get ancestors when getAncestors is true', async () => {
    const ancestorsArgs = {
      organizationId: 'test-org-id',
      conceptId: 'child-concept-id',
      getAncestors: true,
    };

    const mockAncestorsResponse = {
      items: [testConcept],
      total: 1,
      skip: 0,
      limit: 10,
    };

    mockConceptGetAncestors.mockResolvedValue(mockAncestorsResponse);

    const result = await listConceptsTool(ancestorsArgs);

    expect(mockConceptGetAncestors).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptId: 'child-concept-id',
    });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain(
      'Concept ancestors retrieved successfully',
    );
    expect(result.content[0].text).toContain('test-concept-id');
  });

  it('should throw error when conceptId is missing for descendants', async () => {
    const invalidArgs = {
      organizationId: 'test-org-id',
      getDescendants: true,
      // Missing conceptId
    };

    const result = await listConceptsTool(invalidArgs);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain(
      'conceptId is required when getting descendants or ancestors',
    );
  });

  it('should throw error when conceptId is missing for ancestors', async () => {
    const invalidArgs = {
      organizationId: 'test-org-id',
      getAncestors: true,
      // Missing conceptId
    };

    const result = await listConceptsTool(invalidArgs);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain(
      'conceptId is required when getting descendants or ancestors',
    );
  });

  it('should handle descendants with custom parameters', async () => {
    const descendantsArgs = {
      organizationId: 'test-org-id',
      conceptId: 'parent-concept-id',
      getDescendants: true,
      limit: 5,
      skip: 2,
      select: 'sys,prefLabel',
      order: 'sys.createdAt',
    };

    const mockDescendantsResponse = {
      items: [testConcept],
      total: 1,
      skip: 2,
      limit: 5,
    };

    mockConceptGetDescendants.mockResolvedValue(mockDescendantsResponse);

    const result = await listConceptsTool(descendantsArgs);

    expect(mockConceptGetDescendants).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptId: 'parent-concept-id',
      limit: 5,
      skip: 2,
      select: 'sys,prefLabel',
      order: 'sys.createdAt',
    });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain(
      'Concept descendants retrieved successfully',
    );
  });
});
