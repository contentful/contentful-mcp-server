import { describe, it, expect, beforeEach, vi } from 'vitest';
import { searchEntriesTool } from './searchEntries.js';
import { formatResponse } from '../../utils/formatters.js';
import { summarizeData } from '../../utils/summarizer.js';
import {
  setupMockClient,
  mockEntryGetMany,
  mockEntry,
  mockArgs,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');
vi.mock('../../../src/utils/summarizer.js');

describe('searchEntries', () => {
  beforeEach(() => {
    setupMockClient();
  });

  it('should search entries successfully', async () => {
    const testArgs = {
      ...mockArgs,
      query: {
        content_type: 'test-content-type',
        limit: 2,
      },
    };

    const mockEntries = {
      items: [
        {
          mockEntry,
        },
        {
          mockEntry,
        },
      ],
      total: 2,
      skip: 0,
      limit: 2,
    };

    const mockSummarized = {
      items: mockEntries.items,
      total: 2,
      displayed: 2,
    };

    mockEntryGetMany.mockResolvedValue(mockEntries);
    vi.mocked(summarizeData).mockReturnValue(mockSummarized);

    const result = await searchEntriesTool(testArgs);

    const expectedResponse = formatResponse('Entries retrieved successfully', {
      entries: mockSummarized,
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

  it('should search entries with all query parameters', async () => {
    const testArgs = {
      ...mockArgs,
      query: {
        content_type: 'article',
        include: 1,
        select: 'fields.title,fields.slug',
        links_to_entry: 'linked-entry-id',
        limit: 1,
        skip: 5,
        order: 'sys.createdAt',
      },
    };

    const mockEntries = {
      items: [
        {
          ...mockEntry,
          sys: { id: 'entry-1', type: 'Entry' as const },
          fields: {
            title: { 'en-US': 'Article Title' },
            slug: { 'en-US': 'article-slug' },
          },
        },
      ],
      total: 10,
      skip: 5,
      limit: 1,
    };

    const mockSummarized = { items: mockEntries.items, total: 1, displayed: 1 };

    mockEntryGetMany.mockResolvedValue(mockEntries);
    vi.mocked(summarizeData).mockReturnValue(mockSummarized);

    const result = await searchEntriesTool(testArgs);

    const expectedResponse = formatResponse('Entries retrieved successfully', {
      entries: mockSummarized,
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

  it('should limit search results to maximum of 3', async () => {
    const testArgs = {
      ...mockArgs,
      query: {
        limit: 10, // Should be capped to 3
      },
    };

    const mockEntries = {
      items: [],
      total: 0,
      skip: 0,
      limit: 3,
    };

    mockEntryGetMany.mockResolvedValue(mockEntries);
    vi.mocked(summarizeData).mockReturnValue({
      items: [],
      total: 0,
      displayed: 0,
    });

    await searchEntriesTool(testArgs);

    expect(mockEntryGetMany).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      query: {
        limit: 3,
        skip: 0,
      },
    });
  });

  it('should handle errors when search fails', async () => {
    const testArgs = {
      ...mockArgs,
      query: {
        content_type: 'invalid-content-type',
      },
    };

    const error = new Error('Content type not found');
    mockEntryGetMany.mockRejectedValue(error);

    const result = await searchEntriesTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error deleting dataset: Content type not found',
        },
      ],
    });
  });
});
