import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAssetTool } from './getAsset.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockAssetGet,
  mockArgs,
  mockAsset,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('getAsset', () => {
  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  it('should retrieve an asset successfully', async () => {
    mockAssetGet.mockResolvedValue(mockAsset);

    const result = await getAssetTool(mockArgs);

    const expectedResponse = formatResponse('Asset retrieved successfully', {
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
  });

  it('should handle errors when asset retrieval fails', async () => {
    const error = new Error('Asset not found');
    mockAssetGet.mockRejectedValue(error);

    const result = await getAssetTool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving asset: Asset not found',
        },
      ],
    });
  });
});
