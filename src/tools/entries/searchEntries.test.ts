import { describe, it, expect, beforeEach, vi } from 'vitest';
import { searchEntriesTool } from './searchEntries.js';
import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';
import { summarizeData } from '../../utils/summarizer.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');
vi.mock('../../../src/utils/summarizer.js');

describe('searchEntries', () => {
  const mockEntryGetMany = vi.fn();
  const mockClient = {
    entry: {
      getMany: mockEntryGetMany,
    },
  };

  beforeEach(() => {
    vi.mocked(createToolClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof createToolClient>,
    );
  });

  it('should search entries successfully', async () => {
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      query: {
        content_type: 'test-content-type',
        limit: 2,
      },
    };

    const mockEntries = {
      items: [
        {
          sys: {
            id: 'entry-1',
            type: 'Entry',
            contentType: {
              sys: {
                id: 'test-content-type',
                type: 'Link',
                linkType: 'ContentType',
              },
            },
          },
          fields: {
            title: { 'en-US': 'Entry 1' },
          },
        },
        {
          sys: {
            id: 'entry-2',
            type: 'Entry',
            contentType: {
              sys: {
                id: 'test-content-type',
                type: 'Link',
                linkType: 'ContentType',
              },
            },
          },
          fields: {
            title: { 'en-US': 'Entry 2' },
          },
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

    const result = await searchEntriesTool(mockArgs);

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
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
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
          sys: { id: 'entry-1', type: 'Entry' },
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

    const result = await searchEntriesTool(mockArgs);

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
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
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

    await searchEntriesTool(mockArgs);

    expect(mockEntryGetMany).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      query: {
        limit: 3,
        skip: 0,
      },
    });
  });

  it('should handle errors when search fails', async () => {
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      query: {
        content_type: 'invalid-content-type',
      },
    };

    const error = new Error('Content type not found');
    mockEntryGetMany.mockRejectedValue(error);

    const result = await searchEntriesTool(mockArgs);

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
