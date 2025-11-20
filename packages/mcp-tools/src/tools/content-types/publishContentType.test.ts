import { describe, it, expect } from 'vitest';
import {
  mockContentTypeGet,
  mockContentTypePublish,
  mockContentType,
  mockArgs,
} from './mockClient.js';
import { publishContentTypeTool } from './publishContentType.js';
import { formatResponse } from '../../utils/formatters.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('publishContentType', () => {
  const mockConfig = createMockConfig();
  it('should publish a content type successfully', async () => {
    const unpublishedContentType = {
      ...mockContentType,
      sys: {
        ...mockContentType.sys,
        version: 1,
      },
    };

    const publishedContentType = {
      ...mockContentType,
      sys: {
        ...mockContentType.sys,
        version: 2,
        publishedVersion: 2,
      },
    };

    mockContentTypeGet.mockResolvedValue(unpublishedContentType);
    mockContentTypePublish.mockResolvedValue(publishedContentType);

    const tool = publishContentTypeTool(mockConfig);
    const result = await tool(mockArgs);

    const expectedResponse = formatResponse(
      'Content type published successfully',
      {
        contentType: publishedContentType,
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

  it('should handle republishing an already published content type', async () => {
    const alreadyPublishedContentType = {
      ...mockContentType,
      sys: {
        ...mockContentType.sys,
        version: 2,
        publishedVersion: 1,
      },
    };

    const republishedContentType = {
      ...mockContentType,
      sys: {
        ...mockContentType.sys,
        version: 3,
        publishedVersion: 3,
      },
    };

    mockContentTypeGet.mockResolvedValue(alreadyPublishedContentType);
    mockContentTypePublish.mockResolvedValue(republishedContentType);

    const tool = publishContentTypeTool(mockConfig);
    const result = await tool(mockArgs);

    const expectedResponse = formatResponse(
      'Content type published successfully',
      {
        contentType: republishedContentType,
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

  it('should handle errors when publish operation fails', async () => {
    const unpublishedContentType = {
      ...mockContentType,
      sys: {
        ...mockContentType.sys,
        version: 1,
      },
    };

    mockContentTypeGet.mockResolvedValue(unpublishedContentType);
    const publishError = new Error('Validation failed');
    mockContentTypePublish.mockRejectedValue(publishError);

    const tool = publishContentTypeTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error publishing content type: Validation failed',
        },
      ],
    });
  });
});
