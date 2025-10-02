import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockArgs, testTag, mockTagGetMany } from './mockClient.js';
import { listTagsTool } from './listTags.js';
import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';
import { summarizeData } from '../../utils/summarizer.js';

const mockTags = {
  items: [
    testTag,
    { ...testTag, sys: { ...testTag.sys, id: 'test-tag-id-2' } },
  ],
  total: 2,
  limit: 100,
  skip: 0,
};

describe('listTagsTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list tags successfully', async () => {
    mockTagGetMany.mockResolvedValue(mockTags);

    const result = await listTagsTool(mockArgs);

    expect(createToolClient).toHaveBeenCalledWith(mockArgs);
    expect(mockTagGetMany).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      query: {
        limit: 100,
        skip: 0,
      },
    });

    const summarizedTags = mockTags.items.map((tag) => ({
      id: tag.sys.id,
      name: tag.name,
      visibility: tag.sys.visibility,
      createdAt: tag.sys.createdAt,
      updatedAt: tag.sys.updatedAt,
    }));

    const summarized = summarizeData(
      {
        ...mockTags,
        items: summarizedTags,
      },
      {
        maxItems: 100,
        remainingMessage:
          'To see more tags, please ask me to retrieve the next page using the skip parameter.',
      },
    );

    const expectedResponse = formatResponse('Tags retrieved successfully', {
      tags: summarized,
      total: mockTags.total,
      limit: mockTags.limit,
      skip: mockTags.skip,
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

  it('should handle errors when listing tags fails', async () => {
    const error = new Error('Listing failed');
    mockTagGetMany.mockRejectedValue(error);

    const result = await listTagsTool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error listing tags: Listing failed',
        },
      ],
    });
  });
});
