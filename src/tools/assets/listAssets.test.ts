import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listAssetsTool } from './listAssets.js';
import {
  setupMockClient,
  mockAssetGetMany,
  mockArgs,
  mockAssetsResponse,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('listAssets', () => {
  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  it('should list assets successfully with default parameters', async () => {
    mockAssetGetMany.mockResolvedValue(mockAssetsResponse);

    const result = await listAssetsTool(mockArgs);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.stringContaining('Assets retrieved successfully'),
        },
      ],
    });

    expect(mockAssetGetMany).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      query: {
        limit: 3,
        skip: 0,
      },
    });
  });

  it('should list assets with custom limit and skip parameters', async () => {
    const testArgs = {
      ...mockArgs,
      limit: 2,
      skip: 5,
    };

    mockAssetGetMany.mockResolvedValue({
      ...mockAssetsResponse,
      limit: 2,
      skip: 5,
    });

    await listAssetsTool(testArgs);

    expect(mockAssetGetMany).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      query: {
        limit: 2,
        skip: 5,
      },
    });
  });

  it('should enforce maximum limit of 3', async () => {
    const testArgs = {
      ...mockArgs,
      limit: 10, // Should be capped at 3
    };

    mockAssetGetMany.mockResolvedValue(mockAssetsResponse);

    await listAssetsTool(testArgs);

    expect(mockAssetGetMany).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      query: {
        limit: 3, // Should be capped
        skip: 0,
      },
    });
  });

  it('should list assets with optional query parameters', async () => {
    const testArgs = {
      ...mockArgs,
      select: 'sys.id,fields.title',
      include: 2,
      order: 'sys.createdAt',
      links_to_entry: 'entry-id-123',
    };

    mockAssetGetMany.mockResolvedValue(mockAssetsResponse);

    await listAssetsTool(testArgs);

    expect(mockAssetGetMany).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      query: {
        limit: 3,
        skip: 0,
        select: 'sys.id,fields.title',
        include: 2,
        order: 'sys.createdAt',
        links_to_entry: 'entry-id-123',
      },
    });
  });

  it('should handle empty assets list', async () => {
    const emptyResponse = {
      total: 0,
      skip: 0,
      limit: 3,
      items: [],
    };

    mockAssetGetMany.mockResolvedValue(emptyResponse);

    const result = await listAssetsTool(mockArgs);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.stringContaining('Assets retrieved successfully'),
        },
      ],
    });
  });

  it('should handle errors when asset listing fails', async () => {
    const error = new Error('Failed to fetch assets');
    mockAssetGetMany.mockRejectedValue(error);

    const result = await listAssetsTool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error listing assets: Failed to fetch assets',
        },
      ],
    });
  });

  it('should handle assets with missing fields gracefully', async () => {
    const assetsWithMissingFields = {
      total: 1,
      skip: 0,
      limit: 3,
      items: [
        {
          sys: {
            id: 'incomplete-asset',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
          fields: {}, // Missing title, description, file fields
        },
      ],
    };

    mockAssetGetMany.mockResolvedValue(assetsWithMissingFields);

    const result = await listAssetsTool(mockArgs);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.stringContaining('Assets retrieved successfully'),
        },
      ],
    });
  });
});
