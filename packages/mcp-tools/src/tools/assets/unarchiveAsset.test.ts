import { describe, it, expect, beforeEach, vi } from 'vitest';
import { unarchiveAssetTool } from './unarchiveAsset.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockAssetUnarchive,
  mockAsset,
  mockArgs,
  mockArchivedAsset,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('unarchiveAsset', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  describe('single asset', () => {
    it('should unarchive asset successfully with valid parameters', async () => {
      const testArgs = {
        ...mockArgs,
        assetId: 'test-asset-id',
      };

      mockAssetUnarchive.mockResolvedValue(mockAsset);

      const tool = unarchiveAssetTool(mockConfig);
      const result = await tool(testArgs);

      // Verify client was called correctly
      expect(mockAssetUnarchive).toHaveBeenCalledWith({
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
        assetId: testArgs.assetId,
      });

      // Verify response format
      const expectedResponse = formatResponse('Asset unarchived successfully', {
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

    it('should throw error when unarchive fails', async () => {
      const testArgs = {
        ...mockArgs,
        assetId: 'test-asset-id',
      };

      const error = new Error('Asset is not archived');
      mockAssetUnarchive.mockRejectedValue(error);

      const tool = unarchiveAssetTool(mockConfig);
      const result = await tool(testArgs);

      // withErrorHandling wraps the error in a formatted response
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Error unarchiving asset'),
          },
        ],
        isError: true,
      });

      // Verify the error message includes the asset ID
      expect(result.content[0].text).toContain('test-asset-id');
    });
  });

  describe('multiple assets', () => {
    it('should unarchive multiple assets successfully', async () => {
      const testArgs = {
        ...mockArgs,
        assetId: ['asset-1', 'asset-2', 'asset-3'],
      };

      mockAssetUnarchive.mockResolvedValue(mockAsset);

      const tool = unarchiveAssetTool(mockConfig);
      const result = await tool(testArgs);

      // Verify each asset was processed
      expect(mockAssetUnarchive).toHaveBeenCalledTimes(3);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Successfully unarchived 3 assets'),
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
      mockAssetUnarchive
        .mockResolvedValueOnce(mockArchivedAsset)
        .mockRejectedValueOnce(new Error('Must be unpublished'));

      const tool = unarchiveAssetTool(mockConfig);
      const result = await tool(testArgs);

      // Should only process first two assets before stopping
      expect(mockAssetUnarchive).toHaveBeenCalledTimes(2);

      // withErrorHandling wraps the error in a formatted response
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expect.stringContaining('Error unarchiving asset'),
          },
        ],
        isError: true,
      });

      // Verify the error message includes context about successful operations
      expect(result.content[0].text).toContain('asset-2');
      expect(result.content[0].text).toContain(
        'successfully unarchiving 1 asset',
      );
      expect(result.content[0].text).toContain('asset-1');
    });
  });
});
