import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testOrg, mockOrgGetAll, mockCreateClient } from './mockClient.js';
import { listOrgsTool } from './listOrgs.js';
import { formatResponse } from '../../utils/formatters.js';
import { summarizeData } from '../../utils/summarizer.js';
import { createClientConfig } from '../../utils/tools.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

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
  const mockConfig = createMockConfig();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list organizations successfully', async () => {
    mockOrgGetAll.mockResolvedValue(mockOrgs);

    const tool = listOrgsTool(mockConfig);
    const result = await tool({});

    const clientConfig = createClientConfig(mockConfig);
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

  it('should handle errors when listing organizations fails', async () => {
    const error = new Error('Listing failed');
    mockOrgGetAll.mockRejectedValue(error);

    const tool = listOrgsTool(mockConfig);
    const result = await tool({});

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
