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
import { createMockConfig } from '../../test-helpers/mockConfig.js';

vi.mock('../../utils/tools.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../utils/tools.js')>();
  return {
    ...orig,
    createToolClient: vi.fn(),
  };
});

describe('deleteEntry', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    vi.clearAllMocks();
    setupMockClient();
  });

  it('should delete an entry successfully', async () => {
    mockEntryGet.mockResolvedValue(mockEntry);
    mockEntryDelete.mockResolvedValue(undefined);

    const tool = deleteEntryTool(mockConfig);
    const result = await tool(mockArgs);

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

    const tool = deleteEntryTool(mockConfig);
    const result = await tool(mockArgs);

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

    const tool = deleteEntryTool(mockConfig);
    const result = await tool(mockArgs);

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

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = deleteEntryTool(protectedConfig);
    const result = await tool({ ...mockArgs, environmentId: 'master' });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error deleting entry: Environment 'master' is protected. Destructive operations are not allowed.",
        },
      ],
    });
    expect(mockEntryDelete).not.toHaveBeenCalled();
  });
});
