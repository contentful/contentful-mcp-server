import { describe, it, expect, beforeEach } from 'vitest';
import {
  mockContentTypeGet,
  mockContentTypeUpdate,
  mockContentType,
  mockArgs,
} from './mockClient.js';
import { omitContentTypeFieldTool } from './omitContentTypeField.js';
import { formatResponse } from '../../utils/formatters.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('omitContentTypeField', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    mockContentTypeGet.mockReset();
    mockContentTypeUpdate.mockReset();
  });

  it('should omit a field (omitted=true by default)', async () => {
    const testArgs = {
      ...mockArgs,
      fieldId: 'title',
      omitted: true,
    };

    const updatedContentType = {
      ...mockContentType,
      fields: [
        { ...mockContentType.fields[0], omitted: true },
        mockContentType.fields[1],
      ],
      sys: { ...mockContentType.sys, version: 2 },
    };

    mockContentTypeGet.mockResolvedValue(mockContentType);
    mockContentTypeUpdate.mockResolvedValue(updatedContentType);

    const tool = omitContentTypeFieldTool(mockConfig);
    const result = await tool(testArgs);

    expect(mockContentTypeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ contentTypeId: mockArgs.contentTypeId }),
      expect.objectContaining({
        fields: expect.arrayContaining([
          expect.objectContaining({ id: 'title', omitted: true }),
        ]),
      }),
    );

    const expectedResponse = formatResponse(
      `Field "title" updated (omitted=true) on content type "${mockArgs.contentTypeId}". Publish the content type for the change to take effect.`,
      { contentType: updatedContentType },
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
  });

  it('should un-omit a field (omitted=false)', async () => {
    const omittedContentType = {
      ...mockContentType,
      fields: [
        { ...mockContentType.fields[0], omitted: true },
        mockContentType.fields[1],
      ],
    };
    const updatedContentType = {
      ...mockContentType,
      fields: [
        { ...mockContentType.fields[0], omitted: false },
        mockContentType.fields[1],
      ],
      sys: { ...mockContentType.sys, version: 2 },
    };

    mockContentTypeGet.mockResolvedValue(omittedContentType);
    mockContentTypeUpdate.mockResolvedValue(updatedContentType);

    const tool = omitContentTypeFieldTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      fieldId: 'title',
      omitted: false,
    });

    expect(mockContentTypeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ contentTypeId: mockArgs.contentTypeId }),
      expect.objectContaining({
        fields: expect.arrayContaining([
          expect.objectContaining({ id: 'title', omitted: false }),
        ]),
      }),
    );

    const expectedResponse = formatResponse(
      `Field "title" updated (omitted=false) on content type "${mockArgs.contentTypeId}". Publish the content type for the change to take effect.`,
      { contentType: updatedContentType },
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
  });

  it('should return an error when fieldId does not exist', async () => {
    mockContentTypeGet.mockResolvedValue(mockContentType);

    const tool = omitContentTypeFieldTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      fieldId: 'nonexistent',
      omitted: true,
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error omitting field: Field "nonexistent" not found on content type "${mockArgs.contentTypeId}"`,
        },
      ],
    });
    expect(mockContentTypeUpdate).not.toHaveBeenCalled();
  });

  it('should handle errors when update operation fails', async () => {
    mockContentTypeGet.mockResolvedValue(mockContentType);
    mockContentTypeUpdate.mockRejectedValue(new Error('Validation failed'));

    const tool = omitContentTypeFieldTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      fieldId: 'title',
      omitted: true,
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error omitting field: Validation failed',
        },
      ],
    });
  });
});
