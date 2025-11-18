import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getEntryTool } from './getEntry.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockEntryGet,
  mockEntry,
  mockArgs,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('getEntry', () => {
  beforeEach(() => {
    setupMockClient();
  });

  it('should retrieve an entry successfully', async () => {
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
    const mockEmptyEntry = {
      ...mockEntry,
      fields: {},
    };

    mockEntryGet.mockResolvedValue(mockEmptyEntry);

    const result = await getEntryTool(mockArgs);

    const expectedResponse = formatResponse('Entry retrieved successfully', {
      entry: mockEmptyEntry,
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
