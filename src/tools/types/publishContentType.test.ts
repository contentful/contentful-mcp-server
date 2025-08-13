import { describe, it, expect, beforeEach, vi } from 'vitest';
import { publishContentTypeTool } from './publishContentType.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockContentTypeGet,
  mockContentTypePublish,
  mockContentType,
  mockArgs,
} from './mockUtil.js';
import { createToolClient } from '../../utils/tools.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('publishContentType', () => {
  beforeEach(() => {
    setupMockClient();
  });

  it('should publish a content type successfully', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'test-content-type-id',
    };

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

    const result = await publishContentTypeTool(testArgs);

    expect(createToolClient).toHaveBeenCalledWith(testArgs);
    expect(mockContentTypeGet).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      contentTypeId: testArgs.contentTypeId,
    });
    expect(mockContentTypePublish).toHaveBeenCalledWith(
      {
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
        contentTypeId: testArgs.contentTypeId,
      },
      unpublishedContentType,
    );

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
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'published-content-type',
    };

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

    const result = await publishContentTypeTool(testArgs);

    expect(mockContentTypePublish).toHaveBeenCalledWith(
      {
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
        contentTypeId: testArgs.contentTypeId,
      },
      alreadyPublishedContentType,
    );

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

  it('should handle errors when content type is not found', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'non-existent-content-type',
    };

    const error = new Error('Content type not found');
    mockContentTypeGet.mockRejectedValue(error);

    const result = await publishContentTypeTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error publishing content type: Content type not found',
        },
      ],
    });
  });

  it('should handle errors when publish operation fails', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'test-content-type-id',
    };

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

    const result = await publishContentTypeTool(testArgs);

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

  it('should handle permission errors', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'restricted-content-type',
    };

    const error = new Error('Insufficient permissions to publish content type');
    mockContentTypeGet.mockRejectedValue(error);

    const result = await publishContentTypeTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error publishing content type: Insufficient permissions to publish content type',
        },
      ],
    });
  });
});
