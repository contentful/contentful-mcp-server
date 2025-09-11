import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testOrg, mockOrgGetAll, mockCreateClient } from './mockClient.js';
import { listOrgsTool } from './listOrgs.js';
import { formatResponse } from '../../utils/formatters.js';
import { summarizeData } from '../../utils/summarizer.js';
import { getDefaultClientConfig } from '../../config/contentful.js';

const mockOrgs = {
  items: [
    testOrg,
    { ...testOrg, sys: { ...testOrg.sys, id: 'test-org-id-2' } },
  ],
  total: 2,
  limit: 10,
  skip: 0,
};

describe('listOrgsTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list organizations successfully', async () => {
    mockOrgGetAll.mockResolvedValue(mockOrgs);

    const result = await listOrgsTool({});

    const clientConfig = getDefaultClientConfig();
    delete clientConfig.space;
    expect(mockCreateClient).toHaveBeenCalledWith(clientConfig, {
      type: 'plain',
    });
    expect(mockOrgGetAll).toHaveBeenCalledWith({
      query: {
        limit: 10,
        skip: 0,
      },
    });

    const summarizedOrgs = mockOrgs.items.map((org) => ({
      id: org.sys.id,
      name: org.name,
      createdAt: org.sys.createdAt,
      updatedAt: org.sys.updatedAt,
    }));

    const summarized = summarizeData(
      {
        ...mockOrgs,
        items: summarizedOrgs,
      },
      {
        maxItems: 10,
        remainingMessage:
          'To see more organizations, please ask me to retrieve the next page using the skip parameter.',
      },
    );

    const expectedResponse = formatResponse(
      'Organizations retrieved successfully',
      {
        organizations: summarized,
        total: mockOrgs.total,
        limit: mockOrgs.limit,
        skip: mockOrgs.skip,
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

  it('should handle custom limit parameter', async () => {
    mockOrgGetAll.mockResolvedValue(mockOrgs);

    const result = await listOrgsTool({ limit: 5 });

    expect(mockOrgGetAll).toHaveBeenCalledWith({
      query: {
        limit: 5,
        skip: 0,
      },
    });

    expect(result).toBeDefined();
  });

  it('should handle skip parameter for pagination', async () => {
    mockOrgGetAll.mockResolvedValue(mockOrgs);

    const result = await listOrgsTool({ skip: 10 });

    expect(mockOrgGetAll).toHaveBeenCalledWith({
      query: {
        limit: 10,
        skip: 10,
      },
    });

    expect(result).toBeDefined();
  });

  it('should handle select parameter for field selection', async () => {
    mockOrgGetAll.mockResolvedValue(mockOrgs);

    const result = await listOrgsTool({ select: 'sys.id,name' });

    expect(mockOrgGetAll).toHaveBeenCalledWith({
      query: {
        limit: 10,
        skip: 0,
        select: 'sys.id,name',
      },
    });

    expect(result).toBeDefined();
  });

  it('should handle order parameter for sorting', async () => {
    mockOrgGetAll.mockResolvedValue(mockOrgs);

    const result = await listOrgsTool({ order: 'sys.createdAt' });

    expect(mockOrgGetAll).toHaveBeenCalledWith({
      query: {
        limit: 10,
        skip: 0,
        order: 'sys.createdAt',
      },
    });

    expect(result).toBeDefined();
  });

  it('should handle multiple query parameters together', async () => {
    mockOrgGetAll.mockResolvedValue(mockOrgs);

    const result = await listOrgsTool({
      limit: 3,
      skip: 5,
      select: 'sys.id,name,sys.createdAt',
      order: '-sys.updatedAt',
    });

    expect(mockOrgGetAll).toHaveBeenCalledWith({
      query: {
        limit: 3,
        skip: 5,
        select: 'sys.id,name,sys.createdAt',
        order: '-sys.updatedAt',
      },
    });

    expect(result).toBeDefined();
  });

  it('should enforce maximum limit of 10', async () => {
    mockOrgGetAll.mockResolvedValue(mockOrgs);

    const result = await listOrgsTool({ limit: 15 });

    expect(mockOrgGetAll).toHaveBeenCalledWith({
      query: {
        limit: 10, // Should be capped at 10
        skip: 0,
      },
    });

    expect(result).toBeDefined();
  });

  it('should handle errors when listing organizations fails', async () => {
    const error = new Error('Listing failed');
    mockOrgGetAll.mockRejectedValue(error);

    const result = await listOrgsTool({});

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error listing organizations: Listing failed',
        },
      ],
    });
  });
});
