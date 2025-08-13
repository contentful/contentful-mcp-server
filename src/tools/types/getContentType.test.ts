import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getContentTypeTool } from './getContentType.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockContentTypeGet,
  mockContentType,
  mockArgs,
} from './mockUtil.js';
import { createToolClient } from '../../utils/tools.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('getContentType', () => {
  beforeEach(() => {
    setupMockClient();
  });

  it('should retrieve a content type successfully', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'test-content-type-id',
    };

    mockContentTypeGet.mockResolvedValue(mockContentType);

    const result = await getContentTypeTool(testArgs);

    expect(createToolClient).toHaveBeenCalledWith(testArgs);
    expect(mockContentTypeGet).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      contentTypeId: testArgs.contentTypeId,
    });

    const expectedResponse = formatResponse(
      'Content type retrieved successfully',
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

  it('should retrieve a content type with complex field structure', async () => {
    const complexContentType = {
      ...mockContentType,
      fields: [
        {
          id: 'title',
          name: 'Title',
          type: 'Symbol',
          required: true,
          localized: true,
          validations: [{ size: { max: 100 } }],
        },
        {
          id: 'slug',
          name: 'Slug',
          type: 'Symbol',
          required: true,
          localized: false,
          validations: [{ unique: true }],
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
      ],
    };

    const testArgs = {
      ...mockArgs,
      contentTypeId: 'complex-content-type',
    };

    mockContentTypeGet.mockResolvedValue(complexContentType);

    const result = await getContentTypeTool(testArgs);

    const expectedResponse = formatResponse(
      'Content type retrieved successfully',
      {
        contentType: complexContentType,
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

  it('should handle errors when content type is not found', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'non-existent-content-type',
    };

    const error = new Error('Content type not found');
    mockContentTypeGet.mockRejectedValue(error);

    const result = await getContentTypeTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving content type: Content type not found',
        },
      ],
    });
  });

  it('should handle permission errors', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'restricted-content-type',
    };

    const error = new Error('Access denied');
    mockContentTypeGet.mockRejectedValue(error);

    const result = await getContentTypeTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving content type: Access denied',
        },
      ],
    });
  });
});
