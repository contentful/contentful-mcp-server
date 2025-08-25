import { describe, it, expect } from 'vitest';
import {
  mockContentTypeCreate,
  mockContentTypeCreateWithId,
  mockContentType,
  mockArgs,
  mockField,
  mockTextField,
} from './mockClient.js';
import { createContentTypeTool } from './createContentType.js';
import { formatResponse } from '../../utils/formatters.js';

describe('createContentType', () => {
  it('should create a content type successfully with basic fields', async () => {
    const testArgs = {
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      name: 'Test Content Type',
      displayField: 'title',
      description: 'A test content type',
      fields: [mockField, mockTextField],
    };

    mockContentTypeCreate.mockResolvedValue(mockContentType);

    const result = await createContentTypeTool(testArgs);

    const expectedResponse = formatResponse(
      'Content type created successfully',
      {
        contentType: mockContentType,
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

  it('should create a content type without optional description', async () => {
    const testArgs = {
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      name: 'Simple Content Type',
      displayField: 'title',
      fields: [mockField],
    };

    mockContentTypeCreate.mockResolvedValue({
      ...mockContentType,
      name: 'Simple Content Type',
      description: undefined,
    });

    const result = await createContentTypeTool(testArgs);

    const expectedResponse = formatResponse(
      'Content type created successfully',
      {
        contentType: {
          ...mockContentType,
          name: 'Simple Content Type',
          description: undefined,
        },
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

  it('should create a content type with complex field types', async () => {
    const complexFields = [
      {
        id: 'title',
        name: 'Title',
        type: 'Symbol',
        required: true,
        localized: true,
        validations: [{ size: { max: 100 } }],
      },
      {
        id: 'relatedEntries',
        name: 'Related Entries',
        type: 'Array',
        required: false,
        localized: false,
        validations: [],
        items: {
          type: 'Link',
          linkType: 'Entry',
          validations: [],
        },
      },
    ];

    const testArgs = {
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      name: 'Complex Content Type',
      displayField: 'title',
      description: 'A content type with complex fields',
      fields: complexFields,
    };

    const mockComplexContentType = {
      ...mockContentType,
      name: 'Complex Content Type',
      fields: complexFields,
    };

    mockContentTypeCreate.mockResolvedValue(mockComplexContentType);

    const result = await createContentTypeTool(testArgs);

    const expectedResponse = formatResponse(
      'Content type created successfully',
      {
        contentType: mockComplexContentType,
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

  it('should create a content type with fields containing defaultValue', async () => {
    const fieldsWithDefaults = [
      {
        id: 'title',
        name: 'Title',
        type: 'Symbol',
        required: true,
        localized: false,
        defaultValue: 'Untitled',
      },
      {
        id: 'published',
        name: 'Published',
        type: 'Boolean',
        required: false,
        localized: false,
        defaultValue: false,
      },
      {
        id: 'priority',
        name: 'Priority',
        type: 'Integer',
        required: false,
        localized: false,
        defaultValue: 1,
      },
    ];

    const testArgs = {
      ...mockArgs,
      name: 'Content Type with Defaults',
      displayField: 'title',
      description: 'A content type with default values',
      fields: fieldsWithDefaults,
    };

    const mockContentTypeWithDefaults = {
      ...mockContentType,
      name: 'Content Type with Defaults',
      fields: fieldsWithDefaults,
    };

    mockContentTypeCreateWithId.mockResolvedValue(mockContentTypeWithDefaults);

    const result = await createContentTypeTool(testArgs);

    expect(mockContentTypeCreateWithId).toHaveBeenCalledWith(
      {
        contentTypeId: testArgs.contentTypeId,
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
      },
      {
        name: 'Content Type with Defaults',
        displayField: 'title',
        description: 'A content type with default values',
        fields: fieldsWithDefaults,
      },
    );

    const expectedResponse = formatResponse(
      'Content type created successfully',
      {
        contentType: mockContentTypeWithDefaults,
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

  it('should create a content type with custom ID using createWithId', async () => {
    const testArgs = {
      ...mockArgs,
      name: 'Content Type with Custom ID',
      displayField: 'title',
      description: 'A content type with custom ID',
      fields: [mockField],
    };

    const mockContentTypeWithId = {
      ...mockContentType,
      sys: {
        ...mockContentType.sys,
        id: testArgs.contentTypeId,
      },
      name: 'Content Type with Custom ID',
    };

    mockContentTypeCreateWithId.mockResolvedValue(mockContentTypeWithId);

    const result = await createContentTypeTool(testArgs);

    expect(mockContentTypeCreateWithId).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
        contentTypeId: testArgs.contentTypeId,
      },
      {
        name: 'Content Type with Custom ID',
        displayField: 'title',
        description: 'A content type with custom ID',
        fields: [mockField],
      },
    );

    expect(mockContentTypeCreate).not.toHaveBeenCalled();

    const expectedResponse = formatResponse(
      'Content type created successfully',
      {
        contentType: mockContentTypeWithId,
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

  it('should handle errors when content type creation fails', async () => {
    const testArgs = {
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      name: 'Invalid Content Type',
      displayField: 'nonExistentField',
      fields: [mockField],
    };

    const error = new Error('Display field does not exist in fields');
    mockContentTypeCreate.mockRejectedValue(error);

    const result = await createContentTypeTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error creating content type: Display field does not exist in fields',
        },
      ],
    });
  });
});
