import { describe, it, expect, beforeEach } from 'vitest';
import {
  mockContentTypeGet,
  mockContentTypeUpdate,
  mockContentType,
  mockArgs,
} from './mockClient.js';
import { deleteContentTypeFieldTool } from './deleteContentTypeField.js';
import { formatResponse } from '../../utils/formatters.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('deleteContentTypeField', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    mockContentTypeGet.mockReset();
    mockContentTypeUpdate.mockReset();
  });

  const omittedNonRequiredContentType = {
    ...mockContentType,
    fields: [
      { ...mockContentType.fields[0], required: false, omitted: true },
      mockContentType.fields[1],
    ],
  };

  it('should mark a field deleted when it is omitted and not required', async () => {
    const updatedContentType = {
      ...omittedNonRequiredContentType,
      fields: [
        {
          ...omittedNonRequiredContentType.fields[0],
          deleted: true,
        },
        omittedNonRequiredContentType.fields[1],
      ],
      sys: { ...omittedNonRequiredContentType.sys, version: 2 },
    };

    mockContentTypeGet.mockResolvedValue(omittedNonRequiredContentType);
    mockContentTypeUpdate.mockResolvedValue(updatedContentType);

    const tool = deleteContentTypeFieldTool(mockConfig);
    const result = await tool({ ...mockArgs, fieldId: 'title' });

    expect(mockContentTypeUpdate).toHaveBeenCalledTimes(1);
    expect(mockContentTypeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ contentTypeId: mockArgs.contentTypeId }),
      expect.objectContaining({
        fields: expect.arrayContaining([
          expect.objectContaining({ id: 'title', deleted: true }),
        ]),
      }),
    );

    const expectedResponse = formatResponse(
      `Field "title" marked deleted on content type "${mockArgs.contentTypeId}". Publish the content type for the deletion to take effect.`,
      { contentType: updatedContentType },
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
  });

  it('should return an error when fieldId does not exist', async () => {
    mockContentTypeGet.mockResolvedValue(mockContentType);

    const tool = deleteContentTypeFieldTool(mockConfig);
    const result = await tool({ ...mockArgs, fieldId: 'nonexistent' });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error deleting field: Field "nonexistent" not found on content type "${mockArgs.contentTypeId}"`,
        },
      ],
    });
    expect(mockContentTypeUpdate).not.toHaveBeenCalled();
  });

  it('should return an error when the field is required', async () => {
    const requiredContentType = {
      ...mockContentType,
      fields: [
        { ...mockContentType.fields[0], required: true, omitted: true },
        mockContentType.fields[1],
      ],
    };
    mockContentTypeGet.mockResolvedValue(requiredContentType);

    const tool = deleteContentTypeFieldTool(mockConfig);
    const result = await tool({ ...mockArgs, fieldId: 'title' });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error deleting field: Field "title" is required. Set required=false via update_content_type and publish before deleting.',
        },
      ],
    });
    expect(mockContentTypeUpdate).not.toHaveBeenCalled();
  });

  it('should return an error when the field is not yet omitted', async () => {
    const notOmittedContentType = {
      ...mockContentType,
      fields: [
        { ...mockContentType.fields[0], required: false, omitted: false },
        mockContentType.fields[1],
      ],
    };
    mockContentTypeGet.mockResolvedValue(notOmittedContentType);

    const tool = deleteContentTypeFieldTool(mockConfig);
    const result = await tool({ ...mockArgs, fieldId: 'title' });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error deleting field: Field "title" must be omitted and the content type published before it can be deleted. Use omit_content_type_field, then publish_content_type, then retry.',
        },
      ],
    });
    expect(mockContentTypeUpdate).not.toHaveBeenCalled();
  });

  it('should handle errors when update operation fails', async () => {
    mockContentTypeGet.mockResolvedValue(omittedNonRequiredContentType);
    mockContentTypeUpdate.mockRejectedValue(new Error('Version mismatch'));

    const tool = deleteContentTypeFieldTool(mockConfig);
    const result = await tool({ ...mockArgs, fieldId: 'title' });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error deleting field: Version mismatch',
        },
      ],
    });
  });
});
