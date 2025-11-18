import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deleteEntryTool } from './deleteEntry.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockEntryGet,
  mockEntryDelete,
  mockEntry,
  mockArgs,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('deleteEntry', () => {
  beforeEach(() => {
    setupMockClient();
  });

  it('should delete an entry successfully', async () => {
    mockEntryGet.mockResolvedValue(mockEntry);
    mockEntryDelete.mockResolvedValue(undefined);

    const result = await deleteEntryTool(mockArgs);

    const expectedResponse = formatResponse('Entry deleted successfully', {
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

  it('should handle errors when entry get fails during deletion', async () => {
    const error = new Error('Entry not found');
    mockEntryGet.mockRejectedValue(error);

    const result = await deleteEntryTool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error deleting entry: Entry not found',
        },
      ],
    });
  });

  it('should handle errors when entry deletion fails', async () => {
    mockEntryGet.mockResolvedValue(mockEntry);
    const deleteError = new Error('Deletion failed');
    mockEntryDelete.mockRejectedValue(deleteError);

    const result = await deleteEntryTool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error deleting entry: Deletion failed',
        },
      ],
    });
  });
});
