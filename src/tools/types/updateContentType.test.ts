import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateContentTypeTool } from './updateContentType.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockContentTypeGet,
  mockContentTypeUpdate,
  mockContentType,
  mockArgs,
  mockField,
  mockTextField,
  mockLinkField,
  mockArrayField,
} from './mockUtil.js';
import { createToolClient } from '../../utils/tools.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('updateContentType', () => {
  beforeEach(() => {
    setupMockClient();
    // Clear all mocks between tests
    vi.clearAllMocks();
  });

  it('should update a content type with new name only', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'test-content-type-id',
      name: 'Updated Content Type Name',
    };

    const currentContentType = { ...mockContentType };
    const updatedContentType = {
      ...mockContentType,
      name: 'Updated Content Type Name',
      sys: { ...mockContentType.sys, version: 2 },
    };

    mockContentTypeGet.mockResolvedValue(currentContentType);
    mockContentTypeUpdate.mockResolvedValue(updatedContentType);

    const result = await updateContentTypeTool(testArgs);

    expect(createToolClient).toHaveBeenCalledWith(testArgs);
    expect(mockContentTypeGet).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      contentTypeId: testArgs.contentTypeId,
    });
    expect(mockContentTypeUpdate).toHaveBeenCalledWith(
      {
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
        contentTypeId: testArgs.contentTypeId,
      },
      {
        ...currentContentType,
        name: 'Updated Content Type Name',
        description: currentContentType.description,
        displayField: currentContentType.displayField,
        fields: currentContentType.fields,
      },
    );

    const expectedResponse = formatResponse(
      'Content type updated successfully',
      {
        contentType: updatedContentType,
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

  it('should update a content type with new description and displayField', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'test-content-type-id',
      description: 'Updated description',
      displayField: 'description',
    };

    const currentContentType = { ...mockContentType };
    const updatedContentType = {
      ...mockContentType,
      description: 'Updated description',
      displayField: 'description',
      sys: { ...mockContentType.sys, version: 2 },
    };

    mockContentTypeGet.mockResolvedValue(currentContentType);
    mockContentTypeUpdate.mockResolvedValue(updatedContentType);

    const result = await updateContentTypeTool(testArgs);

    expect(mockContentTypeUpdate).toHaveBeenCalledWith(
      {
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
        contentTypeId: testArgs.contentTypeId,
      },
      {
        ...currentContentType,
        name: currentContentType.name,
        description: 'Updated description',
        displayField: 'description',
        fields: currentContentType.fields,
      },
    );
  });

  it('should update a content type with new fields array', async () => {
    const newFields = [
      mockField,
      mockTextField,
      {
        id: 'newField',
        name: 'New Field',
        type: 'Symbol',
        required: false,
        localized: false,
        validations: [],
      },
    ];

    const testArgs = {
      ...mockArgs,
      contentTypeId: 'test-content-type-id',
      fields: newFields,
    };

    const currentContentType = { ...mockContentType };
    const updatedContentType = {
      ...mockContentType,
      fields: newFields,
      sys: { ...mockContentType.sys, version: 2 },
    };

    mockContentTypeGet.mockResolvedValue(currentContentType);
    mockContentTypeUpdate.mockResolvedValue(updatedContentType);

    const result = await updateContentTypeTool(testArgs);

    expect(mockContentTypeUpdate).toHaveBeenCalledWith(
      {
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
        contentTypeId: testArgs.contentTypeId,
      },
      {
        ...currentContentType,
        name: currentContentType.name,
        description: currentContentType.description,
        displayField: currentContentType.displayField,
        fields: newFields,
      },
    );
  });

  it('should preserve existing field metadata when updating fields', async () => {
    const currentContentType = {
      ...mockContentType,
      fields: [
        {
          id: 'title',
          name: 'Title',
          type: 'Symbol',
          required: true,
          localized: false,
          validations: [{ size: { max: 100 } }],
        },
        mockLinkField,
      ],
    };

    const updatedFields = [
      {
        id: 'title',
        name: 'Updated Title',
        type: 'Symbol',
        // required not specified, should preserve existing value
        localized: true, // changed
        // validations not specified, should preserve existing
      },
      {
        id: 'relatedEntry',
        name: 'Updated Related Entry',
        type: 'Link',
        // linkType not specified, should preserve existing
        required: true, // changed
        localized: false,
      },
    ];

    const testArgs = {
      ...mockArgs,
      contentTypeId: 'test-content-type-id',
      fields: updatedFields,
    };

    const expectedMergedFields = [
      {
        id: 'title',
        name: 'Updated Title',
        type: 'Symbol',
        required: true, // preserved from existing
        localized: true, // updated
        validations: [{ size: { max: 100 } }], // preserved from existing
      },
      {
        id: 'relatedEntry',
        name: 'Updated Related Entry',
        type: 'Link',
        linkType: 'Entry', // preserved from existing
        required: true, // updated
        localized: false,
        validations: [], // preserved from existing
      },
    ];

    const updatedContentType = {
      ...mockContentType,
      fields: expectedMergedFields,
      sys: { ...mockContentType.sys, version: 2 },
    };

    mockContentTypeGet.mockResolvedValue(currentContentType);
    mockContentTypeUpdate.mockResolvedValue(updatedContentType);

    const result = await updateContentTypeTool(testArgs);

    expect(mockContentTypeUpdate).toHaveBeenCalledWith(
      {
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
        contentTypeId: testArgs.contentTypeId,
      },
      expect.objectContaining({
        fields: expectedMergedFields,
      }),
    );
  });

  it('should handle Array field items preservation', async () => {
    const currentContentType = {
      ...mockContentType,
      fields: [mockArrayField],
    };

    const updatedFields = [
      {
        id: 'tags',
        name: 'Updated Tags',
        type: 'Array',
        required: true,
        // items not specified, should preserve existing
      },
    ];

    const testArgs = {
      ...mockArgs,
      contentTypeId: 'test-content-type-id',
      fields: updatedFields,
    };

    const expectedMergedFields = [
      {
        id: 'tags',
        name: 'Updated Tags',
        type: 'Array',
        required: true,
        validations: [], // preserved
        items: {
          type: 'Symbol',
          validations: [],
        }, // preserved from existing
      },
    ];

    mockContentTypeGet.mockResolvedValue(currentContentType);
    mockContentTypeUpdate.mockResolvedValue({
      ...mockContentType,
      fields: expectedMergedFields,
    });

    const result = await updateContentTypeTool(testArgs);

    expect(mockContentTypeUpdate).toHaveBeenCalledWith(
      {
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
        contentTypeId: testArgs.contentTypeId,
      },
      expect.objectContaining({
        fields: expectedMergedFields,
      }),
    );
  });

  it('should set required to false for new fields when not specified', async () => {
    const currentContentType = {
      ...mockContentType,
      fields: [mockField],
    };

    const updatedFields = [
      mockField,
      {
        id: 'newField',
        name: 'New Field',
        type: 'Symbol',
        // required not specified for new field
      },
    ];

    const testArgs = {
      ...mockArgs,
      contentTypeId: 'test-content-type-id',
      fields: updatedFields,
    };

    const expectedMergedFields = [
      mockField,
      {
        id: 'newField',
        name: 'New Field',
        type: 'Symbol',
        required: false, // default for new fields
      },
    ];

    mockContentTypeGet.mockResolvedValue(currentContentType);
    mockContentTypeUpdate.mockResolvedValue({
      ...mockContentType,
      fields: expectedMergedFields,
    });

    const result = await updateContentTypeTool(testArgs);

    expect(mockContentTypeUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        fields: expectedMergedFields,
      }),
    );
  });

  it('should update all properties together', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'test-content-type-id',
      name: 'Completely Updated',
      description: 'New description',
      displayField: 'title',
      fields: [mockField],
    };

    const currentContentType = { ...mockContentType };
    const updatedContentType = {
      ...mockContentType,
      name: 'Completely Updated',
      description: 'New description',
      displayField: 'title',
      fields: [mockField],
      sys: { ...mockContentType.sys, version: 2 },
    };

    mockContentTypeGet.mockResolvedValue(currentContentType);
    mockContentTypeUpdate.mockResolvedValue(updatedContentType);

    const result = await updateContentTypeTool(testArgs);

    expect(mockContentTypeUpdate).toHaveBeenCalledWith(
      {
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
        contentTypeId: testArgs.contentTypeId,
      },
      {
        ...currentContentType,
        name: 'Completely Updated',
        description: 'New description',
        displayField: 'title',
        fields: [mockField],
      },
    );
  });

  it('should handle errors when content type is not found', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'non-existent-content-type',
      name: 'Updated Name',
    };

    const error = new Error('Content type not found');
    mockContentTypeGet.mockRejectedValue(error);

    const result = await updateContentTypeTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error updating content type: Content type not found',
        },
      ],
    });
  });

  it('should handle errors when update operation fails', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'test-content-type-id',
      name: 'Updated Name',
    };

    const currentContentType = { ...mockContentType };
    const updateError = new Error('Validation failed');

    mockContentTypeGet.mockResolvedValue(currentContentType);
    mockContentTypeUpdate.mockRejectedValue(updateError);

    const result = await updateContentTypeTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error updating content type: Validation failed',
        },
      ],
    });
  });

  it('should handle update with no changes (empty args)', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'test-content-type-id',
      // No other properties to update
    };

    const currentContentType = { ...mockContentType };
    const updatedContentType = {
      ...mockContentType,
      sys: { ...mockContentType.sys, version: 2 },
    };

    mockContentTypeGet.mockResolvedValue(currentContentType);
    mockContentTypeUpdate.mockResolvedValue(updatedContentType);

    const result = await updateContentTypeTool(testArgs);

    expect(mockContentTypeUpdate).toHaveBeenCalledWith(
      {
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
        contentTypeId: testArgs.contentTypeId,
      },
      {
        ...currentContentType,
        name: currentContentType.name,
        description: currentContentType.description,
        displayField: currentContentType.displayField,
        fields: currentContentType.fields,
      },
    );
  });
});
