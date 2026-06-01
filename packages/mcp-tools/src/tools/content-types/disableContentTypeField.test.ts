import { describe, it, expect, beforeEach } from 'vitest';
import {
  mockContentTypeGet,
  mockContentTypeUpdate,
  mockContentType,
  mockArgs,
} from './mockClient.js';
import { disableContentTypeFieldTool } from './disableContentTypeField.js';
import { formatResponse } from '../../utils/formatters.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('disableContentTypeField', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    mockContentTypeGet.mockReset();
    mockContentTypeUpdate.mockReset();
  });

  it('should disable a field (disabled=true)', async () => {
    const testArgs = {
      ...mockArgs,
      fieldId: 'title',
      disabled: true,
    };

    const updatedContentType = {
      ...mockContentType,
      fields: [
        { ...mockContentType.fields[0], disabled: true },
        mockContentType.fields[1],
      ],
      sys: { ...mockContentType.sys, version: 2 },
    };

    mockContentTypeGet.mockResolvedValue(mockContentType);
    mockContentTypeUpdate.mockResolvedValue(updatedContentType);

    const tool = disableContentTypeFieldTool(mockConfig);
    const result = await tool(testArgs);

    expect(mockContentTypeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ contentTypeId: mockArgs.contentTypeId }),
      expect.objectContaining({
        fields: expect.arrayContaining([
          expect.objectContaining({ id: 'title', disabled: true }),
        ]),
      }),
    );

    const expectedResponse = formatResponse(
      `Field "title" updated (disabled=true) on content type "${mockArgs.contentTypeId}"`,
      { contentType: updatedContentType },
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
  });

  it('should omit a field (omitted=true)', async () => {
    const testArgs = {
      ...mockArgs,
      fieldId: 'description',
      omitted: true,
    };

    const updatedContentType = {
      ...mockContentType,
      fields: [
        mockContentType.fields[0],
        { ...mockContentType.fields[1], omitted: true },
      ],
      sys: { ...mockContentType.sys, version: 2 },
    };

    mockContentTypeGet.mockResolvedValue(mockContentType);
    mockContentTypeUpdate.mockResolvedValue(updatedContentType);

    const tool = disableContentTypeFieldTool(mockConfig);
    const result = await tool(testArgs);

    expect(mockContentTypeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ contentTypeId: mockArgs.contentTypeId }),
      expect.objectContaining({
        fields: expect.arrayContaining([
          expect.objectContaining({ id: 'description', omitted: true }),
        ]),
      }),
    );

    const expectedResponse = formatResponse(
      `Field "description" updated (omitted=true) on content type "${mockArgs.contentTypeId}"`,
      { contentType: updatedContentType },
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
  });

  it('should set both disabled and omitted simultaneously', async () => {
    const testArgs = {
      ...mockArgs,
      fieldId: 'title',
      disabled: true,
      omitted: true,
    };

    const updatedContentType = {
      ...mockContentType,
      fields: [
        { ...mockContentType.fields[0], disabled: true, omitted: true },
        mockContentType.fields[1],
      ],
      sys: { ...mockContentType.sys, version: 2 },
    };

    mockContentTypeGet.mockResolvedValue(mockContentType);
    mockContentTypeUpdate.mockResolvedValue(updatedContentType);

    const tool = disableContentTypeFieldTool(mockConfig);
    const result = await tool(testArgs);

    const expectedResponse = formatResponse(
      `Field "title" updated (disabled=true, omitted=true) on content type "${mockArgs.contentTypeId}"`,
      { contentType: updatedContentType },
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
  });

  it('should re-enable a field (disabled=false)', async () => {
    const disabledContentType = {
      ...mockContentType,
      fields: [
        { ...mockContentType.fields[0], disabled: true },
        mockContentType.fields[1],
      ],
    };

    const testArgs = {
      ...mockArgs,
      fieldId: 'title',
      disabled: false,
    };

    const updatedContentType = {
      ...mockContentType,
      fields: [
        { ...mockContentType.fields[0], disabled: false },
        mockContentType.fields[1],
      ],
      sys: { ...mockContentType.sys, version: 2 },
    };

    mockContentTypeGet.mockResolvedValue(disabledContentType);
    mockContentTypeUpdate.mockResolvedValue(updatedContentType);

    const tool = disableContentTypeFieldTool(mockConfig);
    const result = await tool(testArgs);

    const expectedResponse = formatResponse(
      `Field "title" updated (disabled=false) on content type "${mockArgs.contentTypeId}"`,
      { contentType: updatedContentType },
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
  });

  it('should return an error when neither disabled nor omitted is provided', async () => {
    const testArgs = {
      ...mockArgs,
      fieldId: 'title',
    };

    const tool = disableContentTypeFieldTool(mockConfig);
    const result = await tool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error updating field: At least one of "disabled" or "omitted" must be provided',
        },
      ],
    });

    expect(mockContentTypeGet).not.toHaveBeenCalled();
    expect(mockContentTypeUpdate).not.toHaveBeenCalled();
  });

  it('should return an error when fieldId does not exist', async () => {
    const testArgs = {
      ...mockArgs,
      fieldId: 'nonexistent',
      disabled: true,
    };

    mockContentTypeGet.mockResolvedValue(mockContentType);

    const tool = disableContentTypeFieldTool(mockConfig);
    const result = await tool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error updating field: Field "nonexistent" not found on content type "${mockArgs.contentTypeId}"`,
        },
      ],
    });
    expect(mockContentTypeUpdate).not.toHaveBeenCalled();
  });

  it('should handle errors when update operation fails', async () => {
    const testArgs = {
      ...mockArgs,
      fieldId: 'title',
      disabled: true,
    };

    mockContentTypeGet.mockResolvedValue(mockContentType);
    mockContentTypeUpdate.mockRejectedValue(new Error('Validation failed'));

    const tool = disableContentTypeFieldTool(mockConfig);
    const result = await tool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error updating field: Validation failed',
        },
      ],
    });
  });
});
