import { describe, it, expect, beforeEach } from 'vitest';
import {
  testConceptScheme1,
  testConceptScheme2,
  mockConceptSchemeGetMany,
  mockCreateClient,
} from './mockClient.js';
import { listConceptSchemesTool } from './listConceptSchemes.js';
import { createClientConfig } from '../../../utils/tools.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

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
  const mockConfig = createMockConfig();

  beforeEach(() => {
    mockConceptSchemeGetMany.mockClear();
    mockCreateClient.mockClear();
  });

  const testArgs = {
    organizationId: 'test-org-id',
  };

  it('should list concept schemes successfully with default parameters', async () => {
    mockConceptSchemeGetMany.mockResolvedValue(mockConceptSchemesResponse);

    const tool = listConceptSchemesTool(mockConfig);
    const result = await tool(testArgs);

    const clientConfig = createClientConfig(mockConfig);
    expect(mockCreateClient).toHaveBeenCalledWith(clientConfig, {
      type: 'plain',
    });

    expect(mockConceptSchemeGetMany).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      query: {
        limit: 10,
        skip: 0,
      },
    });

    expect(result).toMatchObject({
      content: [
        {
          type: 'text',
          text: expect.stringContaining(
            'Concept schemes retrieved successfully',
          ),
        },
      ],
    });
  });

  it('should list concept schemes with custom parameters', async () => {
    const customArgs = {
      organizationId: 'test-org-id',
      limit: 5,
      skip: 2,
      select: 'sys.id,prefLabel',
      order: 'sys.createdAt',
    };

    mockConceptSchemeGetMany.mockResolvedValue({
      ...mockConceptSchemesResponse,
      limit: 5,
      skip: 2,
    });

    const tool = listConceptSchemesTool(mockConfig);
    const result = await tool(customArgs);

    expect(mockConceptSchemeGetMany).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      query: {
        limit: 5,
        skip: 2,
        select: 'sys.id,prefLabel',
        order: 'sys.createdAt',
      },
    });

    expect(result).toMatchObject({
      content: [
        {
          type: 'text',
          text: expect.stringContaining(
            'Concept schemes retrieved successfully',
          ),
        },
      ],
    });
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Failed to retrieve concept schemes';
    mockConceptSchemeGetMany.mockRejectedValue(new Error(errorMessage));

    const tool = listConceptSchemesTool(mockConfig);
    const result = await tool(testArgs);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: `Error listing concept schemes: ${errorMessage}`,
        },
      ],
      isError: true,
    });
  });

  it('should handle pagination correctly', async () => {
    const paginatedResponse = {
      sys: {
        type: 'Array',
      },
      total: 15,
      skip: 10,
      limit: 10,
      items: [testConceptScheme1],
    };

    const paginatedArgs = {
      organizationId: 'test-org-id',
      limit: 10,
      skip: 10,
    };

    mockConceptSchemeGetMany.mockResolvedValue(paginatedResponse);

    const tool = listConceptSchemesTool(mockConfig);
    const result = await tool(paginatedArgs);

    expect(mockConceptSchemeGetMany).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      query: {
        limit: 10,
        skip: 10,
      },
    });

    expect(result).toMatchObject({
      content: [
        {
          type: 'text',
          text: expect.stringContaining(
            'Concept schemes retrieved successfully',
          ),
        },
      ],
    });
  });

  it('should handle include parameter', async () => {
    const argsWithInclude = {
      organizationId: 'test-org-id',
      include: 2,
    };

    mockConceptSchemeGetMany.mockResolvedValue(mockConceptSchemesResponse);

    const tool = listConceptSchemesTool(mockConfig);
    const result = await tool(argsWithInclude);

    expect(mockConceptSchemeGetMany).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      query: {
        limit: 10,
        skip: 0,
        include: 2,
      },
    });

    expect(result).toMatchObject({
      content: [
        {
          type: 'text',
          text: expect.stringContaining(
            'Concept schemes retrieved successfully',
          ),
        },
      ],
    });
  });
});
