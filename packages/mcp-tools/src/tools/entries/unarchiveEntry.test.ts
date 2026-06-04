import { describe, it, expect, beforeEach, vi } from 'vitest';
import { unarchiveEntryTool } from './unarchiveEntry.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockEntryUnarchive,
  mockEntry,
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

describe('unarchiveEntry', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  describe('single entry', () => {
    it('should unarchive entry successfully with valid parameters', async () => {
      const testArgs = {
        ...mockArgs,
        entryId: ['test-entry-id'],
      };

      mockEntryUnarchive.mockResolvedValue(mockEntry);

      const tool = unarchiveEntryTool(mockConfig);
      const result = await tool(testArgs);

      // Verify client was called correctly
      expect(mockEntryUnarchive).toHaveBeenCalledWith({
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
        entryId: testArgs.entryId[0],
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
        entryId: ['test-entry-id'],
      };

      const error = new Error('Entry is not archived');
      mockEntryUnarchive.mockRejectedValue(error);

      const tool = unarchiveEntryTool(mockConfig);
      const result = await tool(testArgs);

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

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = unarchiveEntryTool(protectedConfig);
    const result = await tool({ ...mockArgs, environmentId: 'master' });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error unarchiving entry: Environment 'master' is protected. Write and delete operations are not allowed.",
        },
      ],
    });
    expect(mockEntryUnarchive).not.toHaveBeenCalled();
  });

  describe('multiple entries', () => {
    it('should unarchive multiple entries successfully', async () => {
      const testArgs = {
        ...mockArgs,
        entryId: ['entry-1', 'entry-2', 'entry-3'],
      };

      mockEntryUnarchive.mockResolvedValue(mockEntry);

      const tool = unarchiveEntryTool(mockConfig);
      const result = await tool(testArgs);

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

      const tool = unarchiveEntryTool(mockConfig);
      const result = await tool(testArgs);

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

  it('should reject calls that exceed maxBulkSize', async () => {
    const limitedConfig = createMockConfig({ maxBulkSize: 2 });
    const tool = unarchiveEntryTool(limitedConfig);
    const result = await tool({
      ...mockArgs,
      entryId: ['e1', 'e2', 'e3'],
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error unarchiving entry: Bulk operation rejected: 3 IDs exceeds MAX_BULK_SIZE of 2. Reduce batch size or increase the limit.',
        },
      ],
    });
    expect(mockEntryUnarchive).not.toHaveBeenCalled();
  });

  it('should return a dry-run preview without executing when dryRun is true', async () => {
    const tool = unarchiveEntryTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      entryId: ['e1', 'e2'],
      dryRun: true,
    });

    const expectedResponse = formatResponse('Dry run: no changes were made', {
      dryRun: true,
      operation: 'unarchive',
      entityType: 'entry',
      count: 2,
      ids: ['e1', 'e2'],
      target: {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
      },
      message: `Dry run: would unarchive 2 entries in ${mockArgs.spaceId}/${mockArgs.environmentId}. No changes were made. Re-run without dryRun to execute.`,
    });
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
    expect(mockEntryUnarchive).not.toHaveBeenCalled();
  });

  it('should return a dry-run preview for a single entry without executing', async () => {
    const tool = unarchiveEntryTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      entryId: ['e1'],
      dryRun: true,
    });

    expect(result).not.toHaveProperty('isError');
    expect(mockEntryUnarchive).not.toHaveBeenCalled();
  });

  it('uses the default limit (10) when maxBulkSize is unset', async () => {
    const tool = unarchiveEntryTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      entryId: Array.from({ length: 11 }, (_, i) => `e${i}`),
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error unarchiving entry: Bulk operation rejected: 11 IDs exceeds MAX_BULK_SIZE of 10. Reduce batch size or increase the limit.',
        },
      ],
    });
  });

  it('rejects dryRun calls that exceed maxBulkSize', async () => {
    const limitedConfig = createMockConfig({ maxBulkSize: 2 });
    const tool = unarchiveEntryTool(limitedConfig);
    const result = await tool({
      ...mockArgs,
      entryId: ['e1', 'e2', 'e3'],
      dryRun: true,
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error unarchiving entry: Bulk operation rejected: 3 IDs exceeds MAX_BULK_SIZE of 2. Reduce batch size or increase the limit.',
        },
      ],
    });
    expect(mockEntryUnarchive).not.toHaveBeenCalled();
  });
});
