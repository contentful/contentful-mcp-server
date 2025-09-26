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

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('unpublishAsset', () => {
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

    const result = await unpublishAssetTool(mockArgs);

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

    const result = await unpublishAssetTool(testArgs);

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

    const result = await unpublishAssetTool(mockArgs);

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

    const result = await unpublishAssetTool(mockArgs);

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

    const result = await unpublishAssetTool(testArgs);

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

    const result = await unpublishAssetTool(testArgs);

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
    const manyAssets = Array.from({ length: 100 }, (_, i) => `asset${i + 1}`);
    const testArgs = {
      ...mockArgs,
      assetId: manyAssets,
    };

    mockBulkActionUnpublish.mockResolvedValue(mockBulkAction);

    const result = await unpublishAssetTool(testArgs);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.stringContaining('Asset(s) unpublished successfully'),
        },
      ],
    });
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

    const result = await unpublishAssetTool(mockArgs);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.stringContaining('Asset unpublished successfully'),
        },
      ],
    });
  });
});
