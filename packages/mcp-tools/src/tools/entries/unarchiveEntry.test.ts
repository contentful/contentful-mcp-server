import { describe, it, expect, beforeEach, vi } from 'vitest';
import { unarchiveEntryTool } from './unarchiveEntry.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockEntryUnarchive,
  mockEntry,
  mockArgs,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('unarchiveEntry', () => {
  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  describe('single entry', () => {
    it('should unarchive entry successfully with valid parameters', async () => {
      const testArgs = {
        ...mockArgs,
        entryId: 'test-entry-id',
      };

      mockEntryUnarchive.mockResolvedValue(mockEntry);

      const result = await unarchiveEntryTool(testArgs);

      // Verify client was called correctly
      expect(mockEntryUnarchive).toHaveBeenCalledWith({
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
        entryId: testArgs.entryId,
      });

      // Verify response format
      const expectedResponse = formatResponse('Entry unarchived successfully', {
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

    it('should throw error when unarchive fails', async () => {
      const testArgs = {
        ...mockArgs,
        entryId: 'test-entry-id',
      };

      const error = new Error('Entry is not archived');
      mockEntryUnarchive.mockRejectedValue(error);

      const result = await unarchiveEntryTool(testArgs);

      // withErrorHandling wraps the error in a formatted response
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Error unarchiving entry'),
          },
        ],
        isError: true,
      });

      // Verify the error message includes the entry ID
      expect(result.content[0].text).toContain('test-entry-id');
    });
  });

  describe('multiple entries', () => {
    it('should unarchive multiple entries successfully', async () => {
      const testArgs = {
        ...mockArgs,
        entryId: ['entry-1', 'entry-2', 'entry-3'],
      };

      mockEntryUnarchive.mockResolvedValue(mockEntry);

      const result = await unarchiveEntryTool(testArgs);

      // Verify each entry was processed
      expect(mockEntryUnarchive).toHaveBeenCalledTimes(3);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Successfully unarchived 3 entries'),
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
      mockEntryUnarchive
        .mockResolvedValueOnce(mockEntry)
        .mockRejectedValueOnce(new Error('Must be unpublished'));

      const result = await unarchiveEntryTool(testArgs);

      // Should only process first two entries before stopping
      expect(mockEntryUnarchive).toHaveBeenCalledTimes(2);

      // withErrorHandling wraps the error in a formatted response
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Error unarchiving entry'),
          },
        ],
        isError: true,
      });

      // Verify the error message includes context about successful operations
      expect(result.content[0].text).toContain('entry-2');
      expect(result.content[0].text).toContain(
        'successfully unarchiving 1 entry',
      );
      expect(result.content[0].text).toContain('entry-1');
    });
  });
});
