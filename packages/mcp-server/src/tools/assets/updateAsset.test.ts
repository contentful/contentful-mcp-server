import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateAssetTool } from './updateAsset.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockAssetGet,
  mockAssetUpdate,
  mockArgs,
  mockAsset,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('updateAsset', () => {
  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  it('should update an asset successfully with new fields', async () => {
    const testArgs = {
      ...mockArgs,
      fields: {
        title: { 'en-US': 'Updated Asset Title' },
        description: { 'en-US': 'Updated description' },
      },
    };

    const updatedAsset = {
      ...mockAsset,
      fields: {
        ...mockAsset.fields,
        title: { 'en-US': 'Updated Asset Title' },
        description: { 'en-US': 'Updated description' },
      },
    };

    mockAssetGet.mockResolvedValue(mockAsset);
    mockAssetUpdate.mockResolvedValue(updatedAsset);

    const result = await updateAssetTool(testArgs);

    const expectedResponse = formatResponse('Asset updated successfully', {
      updatedAsset,
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

    expect(mockAssetUpdate).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
        assetId: mockArgs.assetId,
      },
      {
        ...mockAsset,
        fields: {
          ...mockAsset.fields,
          ...testArgs.fields,
        },
        metadata: {
          tags: [],
        },
      },
    );
  });

  it('should update an asset with new metadata tags', async () => {
    const testArgs = {
      ...mockArgs,
      fields: {
        title: { 'en-US': 'Asset with Tags' },
      },
      metadata: {
        tags: [
          {
            sys: {
              type: 'Link' as const,
              linkType: 'Tag' as const,
              id: 'new-tag',
            },
          },
        ],
      },
    };

    const assetWithExistingTags = {
      ...mockAsset,
      metadata: {
        tags: [
          {
            sys: {
              type: 'Link' as const,
              linkType: 'Tag' as const,
              id: 'existing-tag',
            },
          },
        ],
      },
    };

    const updatedAsset = {
      ...assetWithExistingTags,
      fields: {
        ...assetWithExistingTags.fields,
        title: { 'en-US': 'Asset with Tags' },
      },
      metadata: {
        tags: [
          {
            sys: {
              type: 'Link' as const,
              linkType: 'Tag' as const,
              id: 'existing-tag',
            },
          },
          {
            sys: {
              type: 'Link' as const,
              linkType: 'Tag' as const,
              id: 'new-tag',
            },
          },
        ],
      },
    };

    mockAssetGet.mockResolvedValue(assetWithExistingTags);
    mockAssetUpdate.mockResolvedValue(updatedAsset);

    await updateAssetTool(testArgs);

    expect(mockAssetUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        metadata: {
          tags: [
            {
              sys: {
                type: 'Link',
                linkType: 'Tag',
                id: 'existing-tag',
              },
            },
            {
              sys: {
                type: 'Link',
                linkType: 'Tag',
                id: 'new-tag',
              },
            },
          ],
        },
      }),
    );
  });

  it('should handle partial field updates', async () => {
    const testArgs = {
      ...mockArgs,
      fields: {
        description: { 'en-US': 'Only description updated' },
      },
    };

    const updatedAsset = {
      ...mockAsset,
      fields: {
        ...mockAsset.fields,
        description: { 'en-US': 'Only description updated' },
      },
    };

    mockAssetGet.mockResolvedValue(mockAsset);
    mockAssetUpdate.mockResolvedValue(updatedAsset);

    await updateAssetTool(testArgs);

    expect(mockAssetUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        fields: {
          ...mockAsset.fields,
          description: { 'en-US': 'Only description updated' },
        },
      }),
    );
  });

  it('should handle errors when asset retrieval fails', async () => {
    const testArgs = {
      ...mockArgs,
      fields: {
        title: { 'en-US': 'Will not work' },
      },
    };

    const error = new Error('Asset not found');
    mockAssetGet.mockRejectedValue(error);

    const result = await updateAssetTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error updating asset: Asset not found',
        },
      ],
    });
  });

  it('should handle errors when asset update fails', async () => {
    const testArgs = {
      ...mockArgs,
      fields: {
        title: { 'en-US': 'Invalid update' },
      },
    };

    mockAssetGet.mockResolvedValue(mockAsset);
    const updateError = new Error('Validation failed');
    mockAssetUpdate.mockRejectedValue(updateError);

    const result = await updateAssetTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error updating asset: Validation failed',
        },
      ],
    });
  });

  it('should handle assets without existing metadata', async () => {
    const assetWithoutMetadata = {
      ...mockAsset,
      metadata: undefined,
    };

    const testArgs = {
      ...mockArgs,
      fields: {
        title: { 'en-US': 'Updated title' },
      },
    };

    mockAssetGet.mockResolvedValue(assetWithoutMetadata);
    mockAssetUpdate.mockResolvedValue({
      ...assetWithoutMetadata,
      fields: {
        ...assetWithoutMetadata.fields,
        title: { 'en-US': 'Updated title' },
      },
    });

    await updateAssetTool(testArgs);

    expect(mockAssetUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        metadata: {
          tags: [],
        },
      }),
    );
  });
});
