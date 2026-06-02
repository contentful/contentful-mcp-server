import { describe, it, expect, beforeEach, vi } from 'vitest';
import { archiveEntryTool } from './archiveEntry.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockEntryArchive,
  mockArchivedEntry,
  mockArgs,
} from './mockClient.js';

vi.mock('../../utils/tools.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../utils/tools.js')>();
  return {
    ...orig,
    createToolClient: vi.fn(),
  };
});
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('archiveEntry', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  describe('single entry', () => {
    it('should archive entry successfully with valid parameters', async () => {
      const testArgs = {
        ...mockArgs,
        entryId: ['test-entry-id'],
      };

      mockEntryArchive.mockResolvedValue(mockArchivedEntry);

      const tool = archiveEntryTool(mockConfig);
      const result = await tool(testArgs);

      // Verify client was called correctly
      expect(mockEntryArchive).toHaveBeenCalledWith({
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
        entryId: testArgs.entryId[0],
      });

      // Verify response format
      const expectedResponse = formatResponse('Entry archived successfully', {
        entryId: 'test-entry-id',
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

    it('should throw error when archive fails', async () => {
      const testArgs = {
        ...mockArgs,
        entryId: ['test-entry-id'],
      };

      const error = new Error('Entry must be unpublished before archiving');
      mockEntryArchive.mockRejectedValue(error);

      const tool = archiveEntryTool(mockConfig);
      const result = await tool(testArgs);

      // withErrorHandling wraps the error in a formatted response
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Error archiving entry'),
          },
        ],
        isError: true,
      });

      // Verify the error message includes the entry ID
      expect(result.content[0].text).toContain('test-entry-id');
    });
  });

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = archiveEntryTool(protectedConfig);
    const result = await tool({ ...mockArgs, environmentId: 'master' });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error archiving entry: Environment 'master' is protected. Write and delete operations are not allowed.",
        },
      ],
    });
    expect(mockEntryArchive).not.toHaveBeenCalled();
  });

  describe('multiple entries', () => {
    it('should archive multiple entries successfully', async () => {
      const testArgs = {
        ...mockArgs,
        entryId: ['entry-1', 'entry-2', 'entry-3'],
      };

      mockEntryArchive.mockResolvedValue(mockArchivedEntry);

      const tool = archiveEntryTool(mockConfig);
      const result = await tool(testArgs);

      // Verify each entry was processed
      expect(mockEntryArchive).toHaveBeenCalledTimes(3);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Successfully archived 3 entries'),
          },
        ],
      });
    });

    it('should stop at first failure and throw error with context', async () => {
      const testArgs = {
        ...mockArgs,
        entryId: ['entry-1', 'entry-2', 'entry-3'],
      };

      // First entry succeeds, second entry fails
      mockEntryArchive
        .mockResolvedValueOnce(mockArchivedEntry)
        .mockRejectedValueOnce(new Error('Must be unpublished'));

      const tool = archiveEntryTool(mockConfig);
      const result = await tool(testArgs);

      // Should only process first two entries before stopping
      expect(mockEntryArchive).toHaveBeenCalledTimes(2);

      // withErrorHandling wraps the error in a formatted response
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Error archiving entry'),
          },
        ],
        isError: true,
      });

      // Verify the error message includes context about successful operations
      expect(result.content[0].text).toContain('entry-2');
      expect(result.content[0].text).toContain(
        'successfully archiving 1 entry',
      );
      expect(result.content[0].text).toContain('entry-1');
    });
  });
});
