import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getEntryTool } from './getEntry.js';
import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('getEntry', () => {
  const mockEntryGet = vi.fn();
  const mockClient = {
    entry: {
      get: mockEntryGet,
    },
  };

  beforeEach(() => {
    vi.mocked(createToolClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof createToolClient>,
    );
  });

  it('should retrieve an entry successfully', async () => {
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'test-entry-id',
    };

    const mockEntry = {
      sys: {
        id: 'test-entry-id',
        type: 'Entry',
        contentType: {
          sys: {
            id: 'test-content-type',
            type: 'Link',
            linkType: 'ContentType',
          },
        },
        version: 1,
      },
      fields: {
        title: { 'en-US': 'Test Entry Title' },
        description: { 'en-US': 'Test Entry Description' },
      },
    };

    mockEntryGet.mockResolvedValue(mockEntry);

    const result = await getEntryTool(mockArgs);

    const expectedResponse = formatResponse('Entry retrieved successfully', {
      entry: mockEntry,
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

  it('should retrieve an entry with empty fields', async () => {
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'empty-entry-id',
    };

    const mockEntry = {
      sys: {
        id: 'empty-entry-id',
        type: 'Entry',
        contentType: {
          sys: {
            id: 'test-content-type',
            type: 'Link',
            linkType: 'ContentType',
          },
        },
        version: 1,
      },
      fields: {},
    };

    mockEntryGet.mockResolvedValue(mockEntry);

    const result = await getEntryTool(mockArgs);

    const expectedResponse = formatResponse('Entry retrieved successfully', {
      entry: mockEntry,
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

  it('should handle errors when entry retrieval fails', async () => {
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'non-existent-entry',
    };

    const error = new Error('Entry not found');
    mockEntryGet.mockRejectedValue(error);

    const result = await getEntryTool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving entry: Entry not found',
        },
      ],
    });
  });
});
