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
});
