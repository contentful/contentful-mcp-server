import { describe, it, expect, beforeEach, vi } from 'vitest';
import { unpublishAssetTool } from './unpublishAsset.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockAssetGet,
  mockAssetUnpublish,
  mockBulkActionUnpublish,
  mockArgs,
  mockAsset,
  mockBulkAction,
} from './mockClient.js';

vi.mock('../../utils/bulkOperations.js', () => ({
  createAssetUnversionedLinks: vi.fn(),
  createEntitiesCollection: vi.fn(),
  waitForBulkActionCompletion: vi.fn(),
}));

vi.mock('../../utils/tools.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../utils/tools.js')>();
  return {
    ...orig,
    createToolClient: vi.fn(),
  };
});
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('unpublishAsset', () => {
  const mockConfig = createMockConfig();

  beforeEach(async () => {
    setupMockClient();
    vi.clearAllMocks();

    // Get the mocked functions and setup their implementations
    const {
      createAssetUnversionedLinks,
      createEntitiesCollection,
      waitForBulkActionCompletion,
    } = await vi.importMock<typeof import('../../utils/bulkOperations.js')>(
      '../../utils/bulkOperations.js',
    );

    vi.mocked(createAssetUnversionedLinks).mockResolvedValue([
      {
        sys: {
          type: 'Link',
          linkType: 'Asset',
          id: 'asset1',
        },
      },
      {
        sys: {
          type: 'Link',
          linkType: 'Asset',
          id: 'asset2',
        },
      },
    ]);

    vi.mocked(createEntitiesCollection).mockReturnValue({
      sys: { type: 'Array' },
      items: [
        {
          sys: {
            type: 'Link',
            linkType: 'Asset',
            id: 'asset1',
          },
        },
        {
          sys: {
            type: 'Link',
            linkType: 'Asset',
            id: 'asset2',
          },
        },
      ],
    });

    vi.mocked(waitForBulkActionCompletion).mockResolvedValue(mockBulkAction);
  });

  it('should unpublish a single asset successfully', async () => {
    const unpublishedAsset = {
      ...mockAsset,
      sys: {
        ...mockAsset.sys,
        status: 'draft',
      },
    };

    mockAssetGet.mockResolvedValue(mockAsset);
    mockAssetUnpublish.mockResolvedValue(unpublishedAsset);

    const tool = unpublishAssetTool(mockConfig);
    const result = await tool(mockArgs);

    const expectedResponse = formatResponse('Asset unpublished successfully', {
      status: unpublishedAsset.sys.status,
      assetId: mockArgs.assetId,
    });
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });

    expect(mockAssetGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      assetId: mockArgs.assetId,
    });

    expect(mockAssetUnpublish).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
        assetId: mockArgs.assetId,
      },
      mockAsset,
    );
  });

  it('should unpublish multiple assets using bulk operations', async () => {
    const testArgs = {
      ...mockArgs,
      assetId: ['asset1', 'asset2'],
    };

    mockBulkActionUnpublish.mockResolvedValue(mockBulkAction);

    const tool = unpublishAssetTool(mockConfig);
    const result = await tool(testArgs);

    const expectedResponse = formatResponse(
      'Asset(s) unpublished successfully',
      {
        status: mockBulkAction.sys.status,
        assetIds: ['asset1', 'asset2'],
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

    expect(mockBulkActionUnpublish).toHaveBeenCalled();
  });

  it('should handle single asset unpublish failure gracefully', async () => {
    mockAssetGet.mockResolvedValue(mockAsset);
    const unpublishError = new Error('Asset cannot be unpublished');
    mockAssetUnpublish.mockRejectedValue(unpublishError);

    const tool = unpublishAssetTool(mockConfig);
    const result = await tool(mockArgs);

    const expectedResponse = formatResponse('Asset unpublish failed', {
      status: unpublishError,
      assetId: mockArgs.assetId,
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

  it('should handle errors when asset retrieval fails before unpublishing', async () => {
    const error = new Error('Asset not found');
    mockAssetGet.mockRejectedValue(error);

    const tool = unpublishAssetTool(mockConfig);
    const result = await tool(mockArgs);

    const expectedResponse = formatResponse('Asset unpublish failed', {
      status: error,
      assetId: mockArgs.assetId,
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

  it('should handle bulk unpublish errors', async () => {
    const testArgs = {
      ...mockArgs,
      assetId: ['asset1', 'asset2'],
    };

    const bulkError = new Error('Bulk unpublish failed');
    mockBulkActionUnpublish.mockRejectedValue(bulkError);

    const tool = unpublishAssetTool(mockConfig);
    const result = await tool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error unpublishing asset: Bulk unpublish failed',
        },
      ],
    });
  });

  it('should handle empty asset array', async () => {
    const testArgs = {
      ...mockArgs,
      assetId: [],
    };

    // Setup mock for empty array case
    const {
      createAssetUnversionedLinks,
      createEntitiesCollection,
      waitForBulkActionCompletion,
    } = await vi.importMock<typeof import('../../utils/bulkOperations.js')>(
      '../../utils/bulkOperations.js',
    );
    vi.mocked(createAssetUnversionedLinks).mockResolvedValue([]);
    vi.mocked(createEntitiesCollection).mockReturnValue({
      sys: { type: 'Array' },
      items: [],
    });
    vi.mocked(waitForBulkActionCompletion).mockResolvedValue(mockBulkAction);

    // Ensure bulk action succeeds for empty array
    mockBulkActionUnpublish.mockResolvedValue(mockBulkAction);

    const tool = unpublishAssetTool(mockConfig);
    const result = await tool(testArgs);

    const expectedResponse = formatResponse(
      'Asset(s) unpublished successfully',
      {
        status: mockBulkAction.sys.status,
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

  it('should respect maximum bulk limit of 100 assets', async () => {
    const expandedConfig = createMockConfig({ maxBulkSize: 100 });
    const manyAssets = Array.from({ length: 100 }, (_, i) => `asset${i + 1}`);
    const testArgs = {
      ...mockArgs,
      assetId: manyAssets,
    };

    mockBulkActionUnpublish.mockResolvedValue(mockBulkAction);

    const tool = unpublishAssetTool(expandedConfig);
    const result = await tool(testArgs);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.stringContaining('Asset(s) unpublished successfully'),
        },
      ],
    });
  });

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = unpublishAssetTool(protectedConfig);
    const result = await tool({ ...mockArgs, environmentId: 'master' });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error unpublishing asset: Environment 'master' is protected. Write and delete operations are not allowed.",
        },
      ],
    });
    expect(mockAssetUnpublish).not.toHaveBeenCalled();
  });

  it('should handle asset with no published version', async () => {
    const draftAsset = {
      ...mockAsset,
      sys: {
        ...mockAsset.sys,
        publishedVersion: undefined,
        status: 'draft',
      },
    };

    mockAssetGet.mockResolvedValue(draftAsset);
    mockAssetUnpublish.mockResolvedValue(draftAsset);

    const tool = unpublishAssetTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.stringContaining('Asset unpublished successfully'),
        },
      ],
    });
  });

  it('should reject calls that exceed maxBulkSize', async () => {
    const limitedConfig = createMockConfig({ maxBulkSize: 2 });
    const tool = unpublishAssetTool(limitedConfig);
    const result = await tool({
      ...mockArgs,
      assetId: ['a1', 'a2', 'a3'],
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error unpublishing asset: Bulk operation rejected: 3 IDs exceeds MAX_BULK_SIZE of 2. Reduce batch size or increase the limit.',
        },
      ],
    });
    expect(mockAssetUnpublish).not.toHaveBeenCalled();
    expect(mockBulkActionUnpublish).not.toHaveBeenCalled();
  });

  it('should return a dry-run preview without executing when dryRun is true', async () => {
    const tool = unpublishAssetTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      assetId: ['a1', 'a2'],
      dryRun: true,
    });

    const expectedResponse = formatResponse('Dry run: no changes were made', {
      dryRun: true,
      operation: 'unpublish',
      entityType: 'asset',
      count: 2,
      ids: ['a1', 'a2'],
      target: {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
      },
      message: `Dry run: would unpublish 2 assets in ${mockArgs.spaceId}/${mockArgs.environmentId}. No changes were made. Re-run without dryRun to execute.`,
    });
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
    expect(mockAssetUnpublish).not.toHaveBeenCalled();
    expect(mockBulkActionUnpublish).not.toHaveBeenCalled();
  });

  it('should return a dry-run preview for a single asset without executing', async () => {
    const tool = unpublishAssetTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      assetId: 'a1',
      dryRun: true,
    });

    expect(result).not.toHaveProperty('isError');
    expect(mockAssetGet).not.toHaveBeenCalled();
    expect(mockAssetUnpublish).not.toHaveBeenCalled();
  });

  it('uses the default limit (10) when maxBulkSize is unset', async () => {
    const tool = unpublishAssetTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      assetId: Array.from({ length: 11 }, (_, i) => `a${i}`),
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error unpublishing asset: Bulk operation rejected: 11 IDs exceeds MAX_BULK_SIZE of 10. Reduce batch size or increase the limit.',
        },
      ],
    });
  });

  it('rejects dryRun calls that exceed maxBulkSize', async () => {
    const limitedConfig = createMockConfig({ maxBulkSize: 2 });
    const tool = unpublishAssetTool(limitedConfig);
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
          text: 'Error unpublishing asset: Bulk operation rejected: 3 IDs exceeds MAX_BULK_SIZE of 2. Reduce batch size or increase the limit.',
        },
      ],
    });
    expect(mockAssetGet).not.toHaveBeenCalled();
    expect(mockAssetUnpublish).not.toHaveBeenCalled();
    expect(mockBulkActionUnpublish).not.toHaveBeenCalled();
  });
});
