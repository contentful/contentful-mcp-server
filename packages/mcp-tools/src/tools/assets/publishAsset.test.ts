import { describe, it, expect, beforeEach, vi } from 'vitest';
import { publishAssetTool } from './publishAsset.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockAssetGet,
  mockAssetPublish,
  mockBulkActionPublish,
  mockArgs,
  mockAsset,
  mockBulkAction,
} from './mockClient.js';

vi.mock('../../utils/bulkOperations.js', () => ({
  createAssetVersionedLinks: vi.fn(),
  createEntitiesCollection: vi.fn(),
  waitForBulkActionCompletion: vi.fn(),
}));

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('publishAsset', () => {
  beforeEach(async () => {
    setupMockClient();
    vi.clearAllMocks();

    // Get the mocked functions and setup their implementations
    const {
      createAssetVersionedLinks,
      createEntitiesCollection,
      waitForBulkActionCompletion,
    } = await vi.importMock<typeof import('../../utils/bulkOperations.js')>(
      '../../utils/bulkOperations.js',
    );

    vi.mocked(createAssetVersionedLinks).mockResolvedValue([
      {
        sys: {
          type: 'Link',
          linkType: 'Asset',
          id: 'asset1',
          version: 1,
        },
      },
      {
        sys: {
          type: 'Link',
          linkType: 'Asset',
          id: 'asset2',
          version: 1,
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

  it('should publish a single asset successfully', async () => {
    const publishedAsset = {
      ...mockAsset,
      sys: {
        ...mockAsset.sys,
        status: 'published',
      },
    };

    mockAssetGet.mockResolvedValue(mockAsset);
    mockAssetPublish.mockResolvedValue(publishedAsset);

    const result = await publishAssetTool(mockArgs);

    const expectedResponse = formatResponse('Asset published successfully', {
      status: publishedAsset.sys.status,
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

    expect(mockAssetPublish).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
        assetId: mockArgs.assetId,
      },
      mockAsset,
    );
  });

  it('should publish multiple assets using bulk operations', async () => {
    const testArgs = {
      ...mockArgs,
      assetId: ['asset1', 'asset2'],
    };

    mockBulkActionPublish.mockResolvedValue(mockBulkAction);

    const result = await publishAssetTool(testArgs);

    const expectedResponse = formatResponse('Asset(s) published successfully', {
      status: mockBulkAction.sys.status,
      assetIds: ['asset1', 'asset2'],
    });
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });

    expect(mockBulkActionPublish).toHaveBeenCalled();
  });

  it('should handle single asset publish failure gracefully', async () => {
    mockAssetGet.mockResolvedValue(mockAsset);
    const publishError = new Error('Asset cannot be published');
    mockAssetPublish.mockRejectedValue(publishError);

    const result = await publishAssetTool(mockArgs);

    const expectedResponse = formatResponse('Asset publish failed', {
      status: publishError,
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

  it('should handle errors when asset retrieval fails before publishing', async () => {
    const error = new Error('Asset not found');
    mockAssetGet.mockRejectedValue(error);

    const result = await publishAssetTool(mockArgs);

    const expectedResponse = formatResponse('Asset publish failed', {
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

  it('should handle bulk publish errors', async () => {
    const testArgs = {
      ...mockArgs,
      assetId: ['asset1', 'asset2'],
    };

    const bulkError = new Error('Bulk publish failed');
    mockBulkActionPublish.mockRejectedValue(bulkError);

    const result = await publishAssetTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error publishing asset: Bulk publish failed',
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
      createAssetVersionedLinks,
      createEntitiesCollection,
      waitForBulkActionCompletion,
    } = await vi.importMock<typeof import('../../utils/bulkOperations.js')>(
      '../../utils/bulkOperations.js',
    );
    vi.mocked(createAssetVersionedLinks).mockResolvedValue([]);
    vi.mocked(createEntitiesCollection).mockReturnValue({
      sys: { type: 'Array' },
      items: [],
    });
    vi.mocked(waitForBulkActionCompletion).mockResolvedValue(mockBulkAction);

    // Ensure bulk action succeeds for empty array
    mockBulkActionPublish.mockResolvedValue(mockBulkAction);

    const result = await publishAssetTool(testArgs);

    const expectedResponse = formatResponse('Asset(s) published successfully', {
      status: mockBulkAction.sys.status,
      assetIds: [],
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

  it('should respect maximum bulk limit of 100 assets', async () => {
    const manyAssets = Array.from({ length: 100 }, (_, i) => `asset${i + 1}`);
    const testArgs = {
      ...mockArgs,
      assetId: manyAssets,
    };

    mockBulkActionPublish.mockResolvedValue(mockBulkAction);

    const result = await publishAssetTool(testArgs);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.stringContaining('Asset(s) published successfully'),
        },
      ],
    });
  });
});
