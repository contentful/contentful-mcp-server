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
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('updateAsset', () => {
  const mockConfig = createMockConfig();

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

    const tool = updateAssetTool(mockConfig);
    const result = await tool(testArgs);

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
          concepts: [],
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
        concepts: [],
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
        concepts: [],
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
        concepts: [],
      },
    };

    mockAssetGet.mockResolvedValue(assetWithExistingTags);
    mockAssetUpdate.mockResolvedValue(updatedAsset);

    const tool = updateAssetTool(mockConfig);
    await tool(testArgs);

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
          concepts: [],
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

    const tool = updateAssetTool(mockConfig);
    await tool(testArgs);

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

    const tool = updateAssetTool(mockConfig);
    const result = await tool(testArgs);

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

    const tool = updateAssetTool(mockConfig);
    const result = await tool(testArgs);

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

    const tool = updateAssetTool(mockConfig);
    await tool(testArgs);

    expect(mockAssetUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        metadata: {
          tags: [],
          concepts: [],
        },
      }),
    );
  });

  it('should update an asset with new taxonomy concepts', async () => {
    const testArgs = {
      ...mockArgs,
      fields: {
        title: { 'en-US': 'Asset with Concepts' },
      },
      metadata: {
        tags: [],
        concepts: [
          {
            sys: {
              type: 'Link' as const,
              linkType: 'TaxonomyConcept' as const,
              id: 'concept-1',
            },
          },
        ],
      },
    };

    const assetWithExistingConcepts = {
      ...mockAsset,
      metadata: {
        tags: [],
        concepts: [
          {
            sys: {
              type: 'Link' as const,
              linkType: 'TaxonomyConcept' as const,
              id: 'existing-concept',
            },
          },
        ],
      },
    };

    const updatedAsset = {
      ...assetWithExistingConcepts,
      fields: {
        ...assetWithExistingConcepts.fields,
        title: { 'en-US': 'Asset with Concepts' },
      },
      metadata: {
        tags: [],
        concepts: [
          {
            sys: {
              type: 'Link' as const,
              linkType: 'TaxonomyConcept' as const,
              id: 'existing-concept',
            },
          },
          {
            sys: {
              type: 'Link' as const,
              linkType: 'TaxonomyConcept' as const,
              id: 'concept-1',
            },
          },
        ],
      },
    };

    mockAssetGet.mockResolvedValue(assetWithExistingConcepts);
    mockAssetUpdate.mockResolvedValue(updatedAsset);

    const tool = updateAssetTool(mockConfig);
    await tool(testArgs);

    expect(mockAssetUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        metadata: {
          tags: [],
          concepts: [
            {
              sys: {
                type: 'Link',
                linkType: 'TaxonomyConcept',
                id: 'existing-concept',
              },
            },
            {
              sys: {
                type: 'Link',
                linkType: 'TaxonomyConcept',
                id: 'concept-1',
              },
            },
          ],
        },
      }),
    );
  });

  it('should update an asset with both tags and concepts', async () => {
    const testArgs = {
      ...mockArgs,
      fields: {
        title: { 'en-US': 'Asset with Tags and Concepts' },
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
        concepts: [
          {
            sys: {
              type: 'Link' as const,
              linkType: 'TaxonomyConcept' as const,
              id: 'new-concept',
            },
          },
        ],
      },
    };

    const assetWithExistingMetadata = {
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
        concepts: [
          {
            sys: {
              type: 'Link' as const,
              linkType: 'TaxonomyConcept' as const,
              id: 'existing-concept',
            },
          },
        ],
      },
    };

    mockAssetGet.mockResolvedValue(assetWithExistingMetadata);
    mockAssetUpdate.mockResolvedValue({
      ...assetWithExistingMetadata,
      fields: {
        ...assetWithExistingMetadata.fields,
        title: { 'en-US': 'Asset with Tags and Concepts' },
      },
    });

    const tool = updateAssetTool(mockConfig);
    await tool(testArgs);

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
          concepts: [
            {
              sys: {
                type: 'Link',
                linkType: 'TaxonomyConcept',
                id: 'existing-concept',
              },
            },
            {
              sys: {
                type: 'Link',
                linkType: 'TaxonomyConcept',
                id: 'new-concept',
              },
            },
          ],
        },
      }),
    );
  });
});
