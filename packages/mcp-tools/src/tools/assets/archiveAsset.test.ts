import { describe, it, expect, beforeEach, vi } from 'vitest';
import { archiveAssetTool } from './archiveAsset.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockAssetArchive,
  mockArchivedAsset,
  mockArgs,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('archiveAsset', () => {
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

      const result = await archiveAssetTool(testArgs);

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

      const result = await archiveAssetTool(testArgs);

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
    });
  });

  describe('multiple assets', () => {
    it('should archive multiple assets successfully', async () => {
      const testArgs = {
        ...mockArgs,
        assetId: ['asset-1', 'asset-2', 'asset-3'],
      };

      mockAssetArchive.mockResolvedValue(mockArchivedAsset);

      const result = await archiveAssetTool(testArgs);

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

    it('should stop at first failure and throw error', async () => {
      const testArgs = {
        ...mockArgs,
        assetId: ['asset-1', 'asset-2', 'asset-3'],
      };

      // First asset succeeds, second asset fails
      mockAssetArchive
        .mockResolvedValueOnce(mockArchivedAsset)
        .mockRejectedValueOnce(new Error('Must be unpublished'));

      const result = await archiveAssetTool(testArgs);

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
    });
  });
});
