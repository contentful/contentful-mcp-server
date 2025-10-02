import { describe, it, expect, beforeEach, vi } from 'vitest';
import { uploadAssetTool } from './uploadAsset.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockAssetCreate,
  mockAssetProcessForAllLocales,
  mockArgs,
  mockFile,
  mockAsset,
  mockProcessedAsset,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('uploadAsset', () => {
  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  it('should upload an asset successfully with basic properties', async () => {
    const testArgs = {
      ...mockArgs,
      title: 'Test Image Upload',
      description: 'A test image upload',
      file: mockFile,
    };

    mockAssetCreate.mockResolvedValue(mockAsset);
    mockAssetProcessForAllLocales.mockResolvedValue(mockProcessedAsset);

    const result = await uploadAssetTool(testArgs);

    const expectedResponse = formatResponse('Asset uploaded successfully', {
      asset: mockProcessedAsset,
    });
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });

    expect(mockAssetCreate).toHaveBeenCalledWith(
      {
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
      },
      {
        fields: {
          title: { 'en-US': 'Test Image Upload' },
          description: { 'en-US': 'A test image upload' },
          file: { 'en-US': mockFile },
        },
        metadata: undefined,
      },
    );
  });

  it('should upload an asset without optional description', async () => {
    const testArgs = {
      ...mockArgs,
      title: 'Simple Asset Upload',
      file: mockFile,
    };

    const assetWithoutDescription = {
      ...mockAsset,
      fields: {
        ...mockAsset.fields,
        description: undefined,
      },
    };

    mockAssetCreate.mockResolvedValue(assetWithoutDescription);
    mockAssetProcessForAllLocales.mockResolvedValue(assetWithoutDescription);

    const result = await uploadAssetTool(testArgs);

    const expectedResponse = formatResponse('Asset uploaded successfully', {
      asset: assetWithoutDescription,
    });
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });

    expect(mockAssetCreate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        fields: expect.objectContaining({
          description: undefined,
        }),
      }),
    );
  });

  it('should upload an asset with tags metadata', async () => {
    const testArgs = {
      ...mockArgs,
      title: 'Tagged Asset',
      file: mockFile,
      metadata: {
        tags: [
          {
            sys: {
              type: 'Link' as const,
              linkType: 'Tag' as const,
              id: 'tag1',
            },
          },
        ],
      },
    };

    mockAssetCreate.mockResolvedValue(mockAsset);
    mockAssetProcessForAllLocales.mockResolvedValue(mockProcessedAsset);

    await uploadAssetTool(testArgs);

    expect(mockAssetCreate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        metadata: testArgs.metadata,
      }),
    );
  });

  it('should handle errors when asset upload fails', async () => {
    const testArgs = {
      ...mockArgs,
      title: 'Failed Upload',
      file: {
        fileName: 'invalid-file.pdf',
        contentType: 'application/pdf',
      },
    };

    const error = new Error('Invalid file format');
    mockAssetCreate.mockRejectedValue(error);

    const result = await uploadAssetTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error uploading asset: Invalid file format',
        },
      ],
    });
  });

  it('should handle errors when asset processing fails', async () => {
    const testArgs = {
      ...mockArgs,
      title: 'Processing Failed',
      file: mockFile,
    };

    mockAssetCreate.mockResolvedValue(mockAsset);
    const processingError = new Error('Asset processing failed');
    mockAssetProcessForAllLocales.mockRejectedValue(processingError);

    const result = await uploadAssetTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error uploading asset: Asset processing failed',
        },
      ],
    });
  });
});
