import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deleteAssetTool } from './deleteAsset.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockAssetGet,
  mockAssetDelete,
  mockArgs,
  mockAsset,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('deleteAsset', () => {
  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  it('should delete an asset successfully', async () => {
    mockAssetGet.mockResolvedValue(mockAsset);
    mockAssetDelete.mockResolvedValue(undefined);

    const result = await deleteAssetTool(mockArgs);

    const expectedResponse = formatResponse('Asset deleted successfully', {
      asset: mockAsset,
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

    expect(mockAssetDelete).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      assetId: mockArgs.assetId,
    });
  });

  it('should handle errors when asset retrieval fails before deletion', async () => {
    const error = new Error('Asset not found');
    mockAssetGet.mockRejectedValue(error);

    const result = await deleteAssetTool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error deleting asset: Asset not found',
        },
      ],
    });

    expect(mockAssetDelete).not.toHaveBeenCalled();
  });

  it('should handle errors when asset deletion fails', async () => {
    mockAssetGet.mockResolvedValue(mockAsset);
    const deletionError = new Error('Asset deletion failed');
    mockAssetDelete.mockRejectedValue(deletionError);

    const result = await deleteAssetTool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error deleting asset: Asset deletion failed',
        },
      ],
    });
  });
});
