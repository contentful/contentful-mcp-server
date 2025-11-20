import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listAssetsTool } from './listAssets.js';
import {
  setupMockClient,
  mockAssetGetMany,
  mockArgs,
  mockAssetsResponse,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('listAssets', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  it('should list assets successfully with default parameters', async () => {
    mockAssetGetMany.mockResolvedValue(mockAssetsResponse);

    const tool = listAssetsTool(mockConfig);
    const result = await tool(mockArgs);

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

    const tool = listAssetsTool(mockConfig);
    await tool(testArgs);

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

    const tool = listAssetsTool(mockConfig);
    await tool(testArgs);

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

    const tool = listAssetsTool(mockConfig);
    await tool(testArgs);

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

    const tool = listAssetsTool(mockConfig);
    const result = await tool(mockArgs);

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

    const tool = listAssetsTool(mockConfig);
    const result = await tool(mockArgs);

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

    const tool = listAssetsTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.stringContaining('Assets retrieved successfully'),
        },
      ],
    });
  });

  it('should list assets with custom locale', async () => {
    const germanAssetResponse = {
      total: 1,
      skip: 0,
      limit: 3,
      items: [
        {
          sys: {
            id: 'german-asset',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
          fields: {
            title: {
              'de-DE': 'Deutscher Titel',
              'en-US': 'English Title',
            },
            description: {
              'de-DE': 'Deutsche Beschreibung',
              'en-US': 'English Description',
            },
            file: {
              'de-DE': {
                fileName: 'test-de.jpg',
                contentType: 'image/jpeg',
                url: 'https://example.com/test-de.jpg',
                details: { size: 1024 },
              },
            },
          },
        },
      ],
    };

    mockAssetGetMany.mockResolvedValue(germanAssetResponse);

    const testArgs = {
      ...mockArgs,
      locale: 'de-DE',
    };

    const tool = listAssetsTool(mockConfig);
    const result = await tool(testArgs);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.stringContaining('Deutscher Titel'),
        },
      ],
    });
  });
});
