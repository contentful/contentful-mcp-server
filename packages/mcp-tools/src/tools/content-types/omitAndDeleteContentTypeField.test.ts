import { describe, it, expect, beforeEach } from 'vitest';
import {
  mockContentTypeGet,
  mockContentTypeUpdate,
  mockContentTypePublish,
  mockContentType,
  mockArgs,
} from './mockClient.js';
import { omitAndDeleteContentTypeFieldTool } from './omitAndDeleteContentTypeField.js';
import { formatResponse } from '../../utils/formatters.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('omitAndDeleteContentTypeField', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    mockContentTypeGet.mockReset();
    mockContentTypeUpdate.mockReset();
    mockContentTypePublish.mockReset();
  });

  it('should omit, publish, then delete a field in sequence', async () => {
    const testArgs = {
      ...mockArgs,
      fieldId: 'title',
    };

    const initialContentType = {
      ...mockContentType,
      sys: { ...mockContentType.sys, version: 1 },
    };

    const omittedContentType = {
      ...mockContentType,
      fields: [
        { ...mockContentType.fields[0], omitted: true },
        mockContentType.fields[1],
      ],
      sys: { ...mockContentType.sys, version: 2 },
    };

    const publishedContentType = {
      ...omittedContentType,
      sys: { ...omittedContentType.sys, version: 3, publishedVersion: 3 },
    };

    const finalContentType = {
      ...publishedContentType,
      fields: [
        { ...omittedContentType.fields[0], deleted: true },
        mockContentType.fields[1],
      ],
      sys: { ...publishedContentType.sys, version: 4 },
    };

    mockContentTypeGet.mockResolvedValue(initialContentType);
    mockContentTypeUpdate
      .mockResolvedValueOnce(omittedContentType)
      .mockResolvedValueOnce(finalContentType);
    mockContentTypePublish.mockResolvedValue(publishedContentType);

    const tool = omitAndDeleteContentTypeFieldTool(mockConfig);
    const result = await tool(testArgs);

    expect(mockContentTypeGet).toHaveBeenCalledTimes(1);
    expect(mockContentTypeUpdate).toHaveBeenCalledTimes(2);
    expect(mockContentTypePublish).toHaveBeenCalledTimes(1);

    expect(mockContentTypeUpdate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ contentTypeId: mockArgs.contentTypeId }),
      expect.objectContaining({
        fields: expect.arrayContaining([
          expect.objectContaining({ id: 'title', omitted: true }),
        ]),
      }),
    );

    expect(mockContentTypeUpdate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ contentTypeId: mockArgs.contentTypeId }),
      expect.objectContaining({
        fields: expect.arrayContaining([
          expect.objectContaining({ id: 'title', deleted: true }),
        ]),
      }),
    );

    const expectedResponse = formatResponse(
      `Field "title" has been omitted and deleted from content type "${mockArgs.contentTypeId}"`,
      { contentType: finalContentType },
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
  });

  it('should return an error when fieldId does not exist', async () => {
    const testArgs = {
      ...mockArgs,
      fieldId: 'nonexistent-field',
    };

    mockContentTypeGet.mockResolvedValue(mockContentType);

    const tool = omitAndDeleteContentTypeFieldTool(mockConfig);
    const result = await tool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error omitting and deleting field: Field "nonexistent-field" not found on content type "${mockArgs.contentTypeId}"`,
        },
      ],
    });

    expect(mockContentTypeUpdate).not.toHaveBeenCalled();
    expect(mockContentTypePublish).not.toHaveBeenCalled();
  });

  it('should return an error when the update (omit step) fails', async () => {
    const testArgs = {
      ...mockArgs,
      fieldId: 'title',
    };

    mockContentTypeGet.mockResolvedValue(mockContentType);
    mockContentTypeUpdate.mockRejectedValue(new Error('Validation failed'));

    const tool = omitAndDeleteContentTypeFieldTool(mockConfig);
    const result = await tool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error omitting and deleting field: Validation failed',
        },
      ],
    });
  });

  it('should return an error when the publish step fails', async () => {
    const testArgs = {
      ...mockArgs,
      fieldId: 'title',
    };

    const omittedContentType = {
      ...mockContentType,
      fields: [
        { ...mockContentType.fields[0], omitted: true },
        mockContentType.fields[1],
      ],
      sys: { ...mockContentType.sys, version: 2 },
    };

    mockContentTypeGet.mockResolvedValue(mockContentType);
    mockContentTypeUpdate.mockResolvedValueOnce(omittedContentType);
    mockContentTypePublish.mockRejectedValue(new Error('Publish failed'));

    const tool = omitAndDeleteContentTypeFieldTool(mockConfig);
    const result = await tool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error omitting and deleting field: Publish failed',
        },
      ],
    });
  });
});
