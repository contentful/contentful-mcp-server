import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createContentTypeTool } from './createContentType.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockContentTypeCreate,
  mockContentType,
  mockArgs,
  mockField,
  mockTextField,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('createContentType', () => {
  beforeEach(() => {
    setupMockClient();
  });

  it('should create a content type successfully with basic fields', async () => {
    const testArgs = {
      ...mockArgs,
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
      ...mockArgs,
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
      ...mockArgs,
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

    mockContentTypeCreate.mockResolvedValue(mockContentTypeWithDefaults);

    const result = await createContentTypeTool(testArgs);

    expect(mockContentTypeCreate).toHaveBeenCalledWith(
      {
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

  it('should handle errors when content type creation fails', async () => {
    const testArgs = {
      ...mockArgs,
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
