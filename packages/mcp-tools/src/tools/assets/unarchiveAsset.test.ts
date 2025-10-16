import { describe, it, expect, beforeEach, vi } from 'vitest';
import { unarchiveAssetTool } from './unarchiveAsset.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockAssetUnarchive,
  mockAsset,
  mockArgs,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('unarchiveAsset', () => {
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

      const result = await unarchiveAssetTool(testArgs);

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

      const result = await unarchiveAssetTool(testArgs);

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
    });
  });

  describe('multiple assets', () => {
    it('should unarchive multiple assets successfully', async () => {
      const testArgs = {
        ...mockArgs,
        assetId: ['asset-1', 'asset-2', 'asset-3'],
      };

      mockAssetUnarchive.mockResolvedValue(mockAsset);

      const result = await unarchiveAssetTool(testArgs);

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

    it('should throw error immediately on first failure', async () => {
      const testArgs = {
        ...mockArgs,
        assetId: ['asset-1', 'asset-2'],
      };

      const error = new Error('Asset not found');
      mockAssetUnarchive.mockRejectedValue(error);

      const result = await unarchiveAssetTool(testArgs);

      // Should only try first asset
      expect(mockAssetUnarchive).toHaveBeenCalledTimes(1);

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
    });

    it('should handle empty array', async () => {
      const testArgs = {
        ...mockArgs,
        assetId: [],
      };

      const result = await unarchiveAssetTool(testArgs);

      expect(mockAssetUnarchive).not.toHaveBeenCalled();

      const expectedResponse = formatResponse(
        'Successfully unarchived 0 assets',
        {
          unarchivedCount: 0,
          assetIds: [],
        },
      );

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: expectedResponse,
          },
        ],
      });
    });
  });
});
