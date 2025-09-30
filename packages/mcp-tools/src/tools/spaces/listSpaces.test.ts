import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testSpace, mockSpaceGetMany, mockCreateClient } from './mockClient.js';
import { listSpacesTool } from './listSpaces.js';
import { formatResponse } from '../../utils/formatters.js';
import { summarizeData } from '../../utils/summarizer.js';
import { getDefaultClientConfig } from '../../config/contentful.js';

const mockSpaces = {
  items: [
    testSpace,
    { ...testSpace, sys: { ...testSpace.sys, id: 'test-space-id-2' } },
  ],
  total: 2,
  limit: 10,
  skip: 0,
};

describe('listSpacesTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list spaces successfully', async () => {
    mockSpaceGetMany.mockResolvedValue(mockSpaces);

    const result = await listSpacesTool({});

    const clientConfig = getDefaultClientConfig();
    delete clientConfig.space;
    expect(mockCreateClient).toHaveBeenCalledWith(clientConfig, {
      type: 'plain',
    });
    expect(mockSpaceGetMany).toHaveBeenCalledWith({
      query: {
        limit: 10,
        skip: 0,
      },
    });

    const summarizedSpaces = mockSpaces.items.map((space) => ({
      id: space.sys.id,
      name: space.name,
      createdAt: space.sys.createdAt,
      updatedAt: space.sys.updatedAt,
    }));

    const summarized = summarizeData(
      {
        ...mockSpaces,
        items: summarizedSpaces,
      },
      {
        maxItems: 10,
        remainingMessage:
          'To see more spaces, please ask me to retrieve the next page using the skip parameter.',
      },
    );

    const expectedResponse = formatResponse('Spaces retrieved successfully', {
      spaces: summarized,
      total: mockSpaces.total,
      limit: mockSpaces.limit,
      skip: mockSpaces.skip,
    });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });
  });

  it('should handle errors when listing spaces fails', async () => {
    const error = new Error('Listing failed');
    mockSpaceGetMany.mockRejectedValue(error);

    const result = await listSpacesTool({});

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error listing spaces: Listing failed',
        },
      ],
    });
  });
});
