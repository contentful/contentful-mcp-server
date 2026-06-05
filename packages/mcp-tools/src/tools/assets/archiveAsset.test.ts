import { describe, it, expect, beforeEach, vi } from 'vitest';
import { archiveAssetTool } from './archiveAsset.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockAssetArchive,
  mockArchivedAsset,
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

describe('archiveAsset', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  describe('single asset', () => {
    it('should archive asset successfully with valid parameters', async () => {
      const testArgs = {
        ...mockArgs,
        assetId: 'test-asset-id',
      };

      mockAssetArchive.mockResolvedValue(mockArchivedAsset);

      const tool = archiveAssetTool(mockConfig);
      const result = await tool(testArgs);

      // Verify client was called correctly
      expect(mockAssetArchive).toHaveBeenCalledWith({
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
        assetId: testArgs.assetId,
      });

      // Verify response format
      const expectedResponse = formatResponse('Asset archived successfully', {
        assetId: 'test-asset-id',
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
        assetId: 'test-asset-id',
      };

      const error = new Error('Asset must be unpublished before archiving');
      mockAssetArchive.mockRejectedValue(error);

      const tool = archiveAssetTool(mockConfig);
      const result = await tool(testArgs);

      // withErrorHandling wraps the error in a formatted response
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Error archiving asset'),
          },
        ],
        isError: true,
      });

      // Verify the error message includes the asset ID
      expect(result.content[0].text).toContain('test-asset-id');
    });
  });

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = archiveAssetTool(protectedConfig);
    const result = await tool({
      ...mockArgs,
      assetId: 'test-asset-id',
      environmentId: 'master',
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error archiving asset: Environment 'master' is protected. Write and delete operations are not allowed.",
        },
      ],
    });
    expect(mockAssetArchive).not.toHaveBeenCalled();
  });

  describe('multiple assets', () => {
    it('should archive multiple assets successfully', async () => {
      const testArgs = {
        ...mockArgs,
        assetId: ['asset-1', 'asset-2', 'asset-3'],
      };

      mockAssetArchive.mockResolvedValue(mockArchivedAsset);

      const tool = archiveAssetTool(mockConfig);
      const result = await tool(testArgs);

      // Verify each asset was processed
      expect(mockAssetArchive).toHaveBeenCalledTimes(3);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Successfully archived 3 assets'),
          },
        ],
      });
    });

    it('should stop at first failure and throw error with context', async () => {
      const testArgs = {
        ...mockArgs,
        assetId: ['asset-1', 'asset-2', 'asset-3'],
      };

      // First asset succeeds, second asset fails
      mockAssetArchive
        .mockResolvedValueOnce(mockArchivedAsset)
        .mockRejectedValueOnce(new Error('Must be unpublished'));

      const tool = archiveAssetTool(mockConfig);
      const result = await tool(testArgs);

      // Should only process first two assets before stopping
      expect(mockAssetArchive).toHaveBeenCalledTimes(2);

      // withErrorHandling wraps the error in a formatted response
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Error archiving asset'),
          },
        ],
        isError: true,
      });

      // Verify the error message includes context about successful operations
      expect(result.content[0].text).toContain('asset-2');
      expect(result.content[0].text).toContain(
        'successfully archiving 1 asset',
      );
      expect(result.content[0].text).toContain('asset-1');
    });
  });

  it('should reject calls that exceed maxBulkSize', async () => {
    const limitedConfig = createMockConfig({ maxBulkSize: 2 });
    const tool = archiveAssetTool(limitedConfig);
    const result = await tool({
      ...mockArgs,
      assetId: ['a1', 'a2', 'a3'],
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error archiving asset: Bulk operation rejected: 3 IDs exceeds MAX_BULK_SIZE of 2. Reduce batch size or increase the limit.',
        },
      ],
    });
    expect(mockAssetArchive).not.toHaveBeenCalled();
  });

  it('should return a dry-run preview without executing when dryRun is true', async () => {
    const tool = archiveAssetTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      assetId: ['a1', 'a2'],
      dryRun: true,
    });

    const expectedResponse = formatResponse('Dry run: no changes were made', {
      dryRun: true,
      operation: 'archive',
      entityType: 'asset',
      count: 2,
      ids: ['a1', 'a2'],
      target: {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
      },
      message: `Dry run: would archive 2 assets in ${mockArgs.spaceId}/${mockArgs.environmentId}. No changes were made. Re-run without dryRun to execute.`,
    });
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
    expect(mockAssetArchive).not.toHaveBeenCalled();
  });

  it('should return a dry-run preview for a single asset without executing', async () => {
    const tool = archiveAssetTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      assetId: 'a1',
      dryRun: true,
    });

    expect(result).not.toHaveProperty('isError');
    expect(mockAssetArchive).not.toHaveBeenCalled();
  });

  it('uses the default limit (10) when maxBulkSize is unset', async () => {
    const tool = archiveAssetTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      assetId: Array.from({ length: 11 }, (_, i) => `a${i}`),
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error archiving asset: Bulk operation rejected: 11 IDs exceeds MAX_BULK_SIZE of 10. Reduce batch size or increase the limit.',
        },
      ],
    });
  });

  it('rejects dryRun calls that exceed maxBulkSize', async () => {
    const limitedConfig = createMockConfig({ maxBulkSize: 2 });
    const tool = archiveAssetTool(limitedConfig);
    const result = await tool({
      ...mockArgs,
      assetId: ['a1', 'a2', 'a3'],
      dryRun: true,
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error archiving asset: Bulk operation rejected: 3 IDs exceeds MAX_BULK_SIZE of 2. Reduce batch size or increase the limit.',
        },
      ],
    });
    expect(mockAssetArchive).not.toHaveBeenCalled();
  });
});
