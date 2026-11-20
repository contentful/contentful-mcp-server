import { describe, it, expect, beforeEach, vi } from 'vitest';
import { uploadAssetTool } from './uploadAsset.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockAssetCreate,
  mockAssetProcessForAllLocales,
  mockAssetProcessForLocale,
  mockAssetGet,
  mockAssetUpdate,
  mockUploadCreate,
  mockArgs,
  mockFile,
  mockAsset,
  mockProcessedAsset,
  mockTags,
} from './mockClient.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

vi.mock('../../utils/tools.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../utils/tools.js')>();
  return {
    ...orig,
    createToolClient: vi.fn(),
  };
});

// upload_asset creates a new asset unless assetId is passed, so the shared
// mockArgs (which include an assetId) are only used for the existing-asset mode.
const { assetId: _assetId, ...baseArgs } = mockArgs;

describe('uploadAsset', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  it('should upload an asset successfully with basic properties', async () => {
    const testArgs = {
      ...baseArgs,
      title: 'Test Image Upload',
      description: 'A test image upload',
      file: mockFile,
    };

    mockAssetCreate.mockResolvedValue(mockAsset);
    mockAssetProcessForAllLocales.mockResolvedValue(mockProcessedAsset);

    const tool = uploadAssetTool(mockConfig);
    const result = await tool(testArgs);

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
      ...baseArgs,
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

    const tool = uploadAssetTool(mockConfig);
    const result = await tool(testArgs);

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
      ...baseArgs,
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

    const tool = uploadAssetTool(mockConfig);
    await tool(testArgs);

    expect(mockAssetCreate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        metadata: testArgs.metadata,
      }),
    );
  });

  it('should handle errors when asset upload fails', async () => {
    const testArgs = {
      ...baseArgs,
      title: 'Failed Upload',
      file: {
        fileName: 'invalid-file.pdf',
        contentType: 'application/pdf',
      },
    };

    const error = new Error('Invalid file format');
    mockAssetCreate.mockRejectedValue(error);

    const tool = uploadAssetTool(mockConfig);
    const result = await tool(testArgs);

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
      ...baseArgs,
      title: 'Processing Failed',
      file: mockFile,
    };

    mockAssetCreate.mockResolvedValue(mockAsset);
    const processingError = new Error('Asset processing failed');
    mockAssetProcessForAllLocales.mockRejectedValue(processingError);

    const tool = uploadAssetTool(mockConfig);
    const result = await tool(testArgs);

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

  it('should upload an asset with taxonomy concepts metadata', async () => {
    const testArgs = {
      ...baseArgs,
      title: 'Asset with Concepts',
      file: mockFile,
      metadata: {
        tags: [],
        concepts: [
          {
            sys: {
              type: 'Link' as const,
              linkType: 'TaxonomyConcept' as const,
              id: 'concept1',
            },
          },
        ],
      },
    };

    mockAssetCreate.mockResolvedValue(mockAsset);
    mockAssetProcessForAllLocales.mockResolvedValue(mockProcessedAsset);

    const tool = uploadAssetTool(mockConfig);
    await tool(testArgs);

    expect(mockAssetCreate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        metadata: testArgs.metadata,
      }),
    );
  });
  it('should upload an asset via base64 data URI using the Upload API', async () => {
    const base64Data = Buffer.from('fake-image-bytes').toString('base64');
    const testArgs = {
      ...baseArgs,
      title: 'Local Image',
      file: {
        fileName: 'photo.jpg',
        contentType: 'image/jpeg',
        upload: `data:image/jpeg;base64,${base64Data}`,
      },
    };

    const mockUpload = { sys: { id: 'upload-123' } };
    mockUploadCreate.mockResolvedValue(mockUpload);
    mockAssetCreate.mockResolvedValue(mockAsset);
    mockAssetProcessForAllLocales.mockResolvedValue(mockProcessedAsset);

    const tool = uploadAssetTool(mockConfig);
    const result = await tool(testArgs);

    expect(mockUploadCreate).toHaveBeenCalledWith(
      { spaceId: testArgs.spaceId, environmentId: testArgs.environmentId },
      { file: expect.any(ArrayBuffer) },
    );

    expect(mockAssetCreate).toHaveBeenCalledWith(
      { spaceId: testArgs.spaceId, environmentId: testArgs.environmentId },
      expect.objectContaining({
        fields: expect.objectContaining({
          file: {
            'en-US': {
              fileName: 'photo.jpg',
              contentType: 'image/jpeg',
              uploadFrom: {
                sys: { type: 'Link', linkType: 'Upload', id: 'upload-123' },
              },
            },
          },
        }),
      }),
    );

    const expectedResponse = formatResponse('Asset uploaded successfully', {
      asset: mockProcessedAsset,
    });
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
  });

  it('should return a clear error when the data URI is malformed (no comma)', async () => {
    const testArgs = {
      ...baseArgs,
      title: 'Bad Upload',
      file: {
        fileName: 'photo.jpg',
        contentType: 'image/jpeg',
        upload: 'data:image/jpeg;base64',
      },
    };

    const tool = uploadAssetTool(mockConfig);
    const result = await tool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error uploading asset: Invalid data URI format. Expected data:<mime>;base64,<data>',
        },
      ],
    });
    expect(mockUploadCreate).not.toHaveBeenCalled();
  });

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = uploadAssetTool(protectedConfig);
    const result = await tool({
      ...baseArgs,
      environmentId: 'master',
      title: 'Test',
      file: mockFile,
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error uploading asset: Environment 'master' is protected. Write and delete operations are not allowed.",
        },
      ],
    });
    expect(mockAssetCreate).not.toHaveBeenCalled();
  });

  it('should upload an asset with a custom locale', async () => {
    const testArgs = {
      ...baseArgs,
      title: 'Deutsche Testdatei',
      description: 'Eine deutsche Beschreibung',
      file: mockFile,
      locale: 'de-DE',
    };

    mockAssetCreate.mockResolvedValue(mockAsset);
    mockAssetProcessForAllLocales.mockResolvedValue(mockProcessedAsset);

    const tool = uploadAssetTool(mockConfig);
    const result = await tool(testArgs);

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
          title: { 'de-DE': 'Deutsche Testdatei' },
          description: { 'de-DE': 'Eine deutsche Beschreibung' },
          file: { 'de-DE': mockFile },
        },
        metadata: undefined,
      },
    );
  });

  describe('with assetId (attach a file to a locale of an existing asset)', () => {
    const arFile = {
      fileName: 'banner-ar.jpg',
      contentType: 'image/jpeg',
      upload: 'https://upload.example.com/banner-ar.jpg',
    };

    const existingAsset = {
      ...mockAsset,
      sys: { ...mockAsset.sys, version: 5 },
      metadata: { tags: [mockTags.existingTag], concepts: [] },
    };

    const updatedAsset = {
      ...existingAsset,
      sys: { ...existingAsset.sys, version: 6 },
    };

    const processedAsset = {
      ...updatedAsset,
      fields: {
        ...updatedAsset.fields,
        file: {
          ...updatedAsset.fields.file,
          ar: {
            fileName: 'banner-ar.jpg',
            contentType: 'image/jpeg',
            url: '//images.ctfassets.net/test-space-id/test-asset-id/abc/banner-ar.jpg',
          },
        },
      },
    };

    it('adds the file for the locale, keeps other locales, and processes only that locale', async () => {
      mockAssetGet.mockResolvedValue(existingAsset);
      mockAssetUpdate.mockResolvedValue(updatedAsset);
      mockAssetProcessForLocale.mockResolvedValue(processedAsset);

      const tool = uploadAssetTool(mockConfig);
      const result = await tool({
        ...baseArgs,
        assetId: 'test-asset-id',
        locale: 'ar',
        file: arFile,
      });

      expect(mockAssetCreate).not.toHaveBeenCalled();
      expect(mockAssetProcessForAllLocales).not.toHaveBeenCalled();

      expect(mockAssetGet).toHaveBeenCalledWith({
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
        assetId: 'test-asset-id',
      });

      expect(mockAssetUpdate).toHaveBeenCalledWith(
        {
          spaceId: mockArgs.spaceId,
          environmentId: mockArgs.environmentId,
          assetId: 'test-asset-id',
        },
        {
          ...existingAsset,
          fields: {
            ...existingAsset.fields,
            file: {
              'en-US': existingAsset.fields.file['en-US'],
              ar: arFile,
            },
          },
          metadata: { tags: [mockTags.existingTag], concepts: [] },
        },
      );

      expect(mockAssetProcessForLocale).toHaveBeenCalledWith(
        { spaceId: mockArgs.spaceId, environmentId: mockArgs.environmentId },
        updatedAsset,
        'ar',
      );

      const expectedResponse = formatResponse(
        'Asset file uploaded and processed for locale "ar"',
        { asset: processedAsset },
      );
      expect(result).toEqual({
        content: [{ type: 'text', text: expectedResponse }],
      });
    });

    it('uploads a base64 data URI and links it to the locale via uploadFrom', async () => {
      const base64Data = Buffer.from('fake-image-bytes').toString('base64');
      mockAssetGet.mockResolvedValue(existingAsset);
      mockUploadCreate.mockResolvedValue({ sys: { id: 'upload-ar' } });
      mockAssetUpdate.mockResolvedValue(updatedAsset);
      mockAssetProcessForLocale.mockResolvedValue(processedAsset);

      const tool = uploadAssetTool(mockConfig);
      await tool({
        ...baseArgs,
        assetId: 'test-asset-id',
        locale: 'ar',
        file: {
          fileName: 'banner-ar.jpg',
          contentType: 'image/jpeg',
          upload: `data:image/jpeg;base64,${base64Data}`,
        },
      });

      expect(mockUploadCreate).toHaveBeenCalledWith(
        { spaceId: mockArgs.spaceId, environmentId: mockArgs.environmentId },
        { file: expect.any(ArrayBuffer) },
      );
      const updatePayload = mockAssetUpdate.mock.calls[0][1];
      expect(updatePayload.fields.file).toEqual({
        'en-US': existingAsset.fields.file['en-US'],
        ar: {
          fileName: 'banner-ar.jpg',
          contentType: 'image/jpeg',
          uploadFrom: {
            sys: { type: 'Link', linkType: 'Upload', id: 'upload-ar' },
          },
        },
      });
    });

    it('sets title and description only for the target locale when provided', async () => {
      mockAssetGet.mockResolvedValue(existingAsset);
      mockAssetUpdate.mockResolvedValue(updatedAsset);
      mockAssetProcessForLocale.mockResolvedValue(processedAsset);

      const tool = uploadAssetTool(mockConfig);
      await tool({
        ...baseArgs,
        assetId: 'test-asset-id',
        locale: 'ar',
        title: 'عنوان',
        description: 'وصف',
        file: arFile,
      });

      const updatePayload = mockAssetUpdate.mock.calls[0][1];
      expect(updatePayload.fields.title).toEqual({
        'en-US': 'Test Asset',
        ar: 'عنوان',
      });
      expect(updatePayload.fields.description).toEqual({
        'en-US': 'A test asset for unit tests',
        ar: 'وصف',
      });
    });

    it('leaves title and description untouched when not provided', async () => {
      mockAssetGet.mockResolvedValue(existingAsset);
      mockAssetUpdate.mockResolvedValue(updatedAsset);
      mockAssetProcessForLocale.mockResolvedValue(processedAsset);

      const tool = uploadAssetTool(mockConfig);
      await tool({
        ...baseArgs,
        assetId: 'test-asset-id',
        locale: 'ar',
        file: arFile,
      });

      const updatePayload = mockAssetUpdate.mock.calls[0][1];
      expect(updatePayload.fields.title).toEqual(existingAsset.fields.title);
      expect(updatePayload.fields.description).toEqual(
        existingAsset.fields.description,
      );
    });

    it('merges metadata tags without duplicating existing ones', async () => {
      mockAssetGet.mockResolvedValue(existingAsset);
      mockAssetUpdate.mockResolvedValue(updatedAsset);
      mockAssetProcessForLocale.mockResolvedValue(processedAsset);

      const tool = uploadAssetTool(mockConfig);
      await tool({
        ...baseArgs,
        assetId: 'test-asset-id',
        locale: 'ar',
        file: arFile,
        metadata: { tags: [mockTags.existingTag, mockTags.tag1] },
      });

      const updatePayload = mockAssetUpdate.mock.calls[0][1];
      expect(updatePayload.metadata).toEqual({
        tags: [mockTags.existingTag, mockTags.tag1],
        concepts: [],
      });
    });

    it('requires locale when assetId is provided', async () => {
      const tool = uploadAssetTool(mockConfig);
      const result = await tool({
        ...baseArgs,
        assetId: 'test-asset-id',
        file: arFile,
      });

      expect(result).toEqual({
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Error uploading asset: locale is required when assetId is provided, so the file is attached to the intended locale of the existing asset.',
          },
        ],
      });
      expect(mockAssetGet).not.toHaveBeenCalled();
      expect(mockAssetUpdate).not.toHaveBeenCalled();
    });

    it('does not create an upload when the asset cannot be fetched', async () => {
      mockAssetGet.mockRejectedValue(
        new Error('The resource could not be found.'),
      );

      const tool = uploadAssetTool(mockConfig);
      const result = await tool({
        ...baseArgs,
        assetId: 'missing-asset',
        locale: 'ar',
        file: {
          fileName: 'banner-ar.jpg',
          contentType: 'image/jpeg',
          upload: `data:image/jpeg;base64,${Buffer.from('x').toString('base64')}`,
        },
      });

      expect(result).toEqual({
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Error uploading asset: The resource could not be found.',
          },
        ],
      });
      expect(mockUploadCreate).not.toHaveBeenCalled();
      expect(mockAssetUpdate).not.toHaveBeenCalled();
    });

    it('returns an error when processing the locale fails', async () => {
      mockAssetGet.mockResolvedValue(existingAsset);
      mockAssetUpdate.mockResolvedValue(updatedAsset);
      mockAssetProcessForLocale.mockRejectedValue(
        new Error('Asset is taking longer then expected to process.'),
      );

      const tool = uploadAssetTool(mockConfig);
      const result = await tool({
        ...baseArgs,
        assetId: 'test-asset-id',
        locale: 'ar',
        file: arFile,
      });

      expect(result).toEqual({
        isError: true,
        content: [
          {
            type: 'text',
            text: 'Error uploading asset: Asset is taking longer then expected to process.',
          },
        ],
      });
    });
  });

  it('requires title when creating a new asset', async () => {
    const tool = uploadAssetTool(mockConfig);
    const result = await tool({ ...baseArgs, file: mockFile });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error uploading asset: title is required when creating a new asset.',
        },
      ],
    });
    expect(mockAssetCreate).not.toHaveBeenCalled();
  });
});
