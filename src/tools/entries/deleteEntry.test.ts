import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deleteEntryTool } from './deleteEntry.js';
import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('deleteEntry', () => {
  const mockEntryGet = vi.fn();
  const mockEntryDelete = vi.fn();
  const mockClient = {
    entry: {
      get: mockEntryGet,
      delete: mockEntryDelete,
    },
  };

  beforeEach(() => {
    vi.mocked(createToolClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof createToolClient>,
    );
  });

  it('should delete an entry successfully', async () => {
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
      },
    };

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
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'non-existent-entry',
    };

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
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'test-entry-id',
    };

    const mockEntry = {
      sys: { id: 'test-entry-id', type: 'Entry' },
      fields: {},
    };

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
