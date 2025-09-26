import { describe, it, expect } from 'vitest';
import {
  mockContentTypeGet,
  mockContentTypeUpdate,
  mockContentType,
  mockArgs,
  mockField,
  mockTextField,
  mockLinkField,
} from './mockClient.js';
import { updateContentTypeTool } from './updateContentType.js';
import { formatResponse } from '../../utils/formatters.js';

describe('updateContentType', () => {
  it('should update a content type with new name only', async () => {
    const testArgs = {
      ...mockArgs,
      name: 'Updated Content Type Name',
    };

    const updatedContentType = {
      ...mockContentType,
      name: 'Updated Content Type Name',
      sys: { ...mockContentType.sys, version: 2 },
    };

    mockContentTypeGet.mockResolvedValue(mockContentType);
    mockContentTypeUpdate.mockResolvedValue(updatedContentType);

    const result = await updateContentTypeTool(testArgs);

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
      description: 'Updated description',
      displayField: 'description',
    };

    const updatedContentType = {
      ...mockContentType,
      description: 'Updated description',
      displayField: 'description',
      sys: { ...mockContentType.sys, version: 2 },
    };

    mockContentTypeGet.mockResolvedValue(mockContentType);
    mockContentTypeUpdate.mockResolvedValue(updatedContentType);

    const result = await updateContentTypeTool(testArgs);

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

  it('should update a content type with new fields array', async () => {
    const newFields = [mockField, mockTextField, mockLinkField];

    const testArgs = {
      ...mockArgs,
      fields: newFields,
    };

    const updatedContentType = {
      ...mockContentType,
      fields: newFields,
      sys: { ...mockContentType.sys, version: 2 },
    };

    mockContentTypeGet.mockResolvedValue(mockContentType);
    mockContentTypeUpdate.mockResolvedValue(updatedContentType);

    const result = await updateContentTypeTool(testArgs);

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
        required: true, // explicitly set to match schema requirements
        localized: true, // changed
        disabled: false,
        omitted: false,
        // validations not specified, should preserve existing
      },
      {
        id: 'relatedEntry',
        name: 'Updated Related Entry',
        type: 'Link',
        // linkType not specified, should preserve existing
        required: true, // changed
        localized: false,
        disabled: false,
        omitted: false,
      },
    ];

    const testArgs = {
      ...mockArgs,
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

  it('should handle errors when update operation fails', async () => {
    const testArgs = {
      ...mockArgs,
      name: 'Updated Name',
    };

    const updateError = new Error('Validation failed');

    mockContentTypeGet.mockResolvedValue(mockContentType);
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

  it('should update a content type with taxonomy metadata', async () => {
    const currentContentType = { ...mockContentType };

    const taxonomyMetadata = {
      taxonomy: [
        {
          sys: {
            type: 'Link' as const,
            linkType: 'TaxonomyConceptScheme' as const,
            id: 'updated-concept-scheme',
          },
          required: true,
        },
        {
          sys: {
            type: 'Link' as const,
            linkType: 'TaxonomyConcept' as const,
            id: 'updated-concept',
          },
          required: false,
        },
      ],
    };

    const testArgs = {
      ...mockArgs,
      metadata: taxonomyMetadata,
    };

    const updatedContentType = {
      ...mockContentType,
      sys: { ...mockContentType.sys, version: 2 },
      metadata: taxonomyMetadata,
    };

    mockContentTypeGet.mockResolvedValue(currentContentType);
    mockContentTypeUpdate.mockResolvedValue(updatedContentType);

    const result = await updateContentTypeTool(testArgs);

    expect(mockContentTypeUpdate).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
        contentTypeId: mockArgs.contentTypeId,
      },
      expect.objectContaining({
        metadata: taxonomyMetadata,
      }),
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

  it('should handle update with no changes (empty args)', async () => {
    const currentContentType = { ...mockContentType };
    const updatedContentType = {
      ...mockContentType,
      sys: { ...mockContentType.sys, version: 2 },
    };

    mockContentTypeGet.mockResolvedValue(currentContentType);
    mockContentTypeUpdate.mockResolvedValue(updatedContentType);

    const result = await updateContentTypeTool(mockArgs);

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
});
