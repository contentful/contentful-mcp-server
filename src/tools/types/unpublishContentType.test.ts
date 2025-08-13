import { describe, it, expect, beforeEach, vi } from 'vitest';
import { unpublishContentTypeTool } from './unpublishContentType.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockContentTypeUnpublish,
  mockContentType,
  mockArgs,
} from './mockUtil.js';
import { createToolClient } from '../../utils/tools.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('unpublishContentType', () => {
  beforeEach(() => {
    setupMockClient();
  });

  it('should unpublish a content type successfully', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'test-content-type-id',
    };

    const unpublishedContentType = {
      ...mockContentType,
      sys: {
        ...mockContentType.sys,
        version: 3,
        // publishedVersion is removed when unpublished
      },
    };

    mockContentTypeUnpublish.mockResolvedValue(unpublishedContentType);

    const result = await unpublishContentTypeTool(testArgs);

    expect(createToolClient).toHaveBeenCalledWith(testArgs);
    expect(mockContentTypeUnpublish).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      contentTypeId: testArgs.contentTypeId,
    });

    const expectedResponse = formatResponse(
      'Content type unpublished successfully',
      {
        contentType: unpublishedContentType,
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

  it('should handle unpublishing an already unpublished content type', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'unpublished-content-type',
    };

    const alreadyUnpublishedContentType = {
      ...mockContentType,
      sys: {
        ...mockContentType.sys,
        version: 1,
        // No publishedVersion indicates it's already unpublished
      },
    };

    mockContentTypeUnpublish.mockResolvedValue(alreadyUnpublishedContentType);

    const result = await unpublishContentTypeTool(testArgs);

    expect(mockContentTypeUnpublish).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      contentTypeId: testArgs.contentTypeId,
    });

    const expectedResponse = formatResponse(
      'Content type unpublished successfully',
      {
        contentType: alreadyUnpublishedContentType,
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
    mockContentTypeUnpublish.mockRejectedValue(error);

    const result = await unpublishContentTypeTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error unpublishing content type: Content type not found',
        },
      ],
    });
  });

  it('should handle errors when unpublish operation fails due to existing entries', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'content-type-with-entries',
    };

    const error = new Error(
      'Cannot unpublish content type with published entries',
    );
    mockContentTypeUnpublish.mockRejectedValue(error);

    const result = await unpublishContentTypeTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error unpublishing content type: Cannot unpublish content type with published entries',
        },
      ],
    });
  });

  it('should handle permission errors', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'restricted-content-type',
    };

    const error = new Error(
      'Insufficient permissions to unpublish content type',
    );
    mockContentTypeUnpublish.mockRejectedValue(error);

    const result = await unpublishContentTypeTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error unpublishing content type: Insufficient permissions to unpublish content type',
        },
      ],
    });
  });

  it('should handle content type already in draft state error', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'draft-content-type',
    };

    const error = new Error('Content type is already in draft state');
    mockContentTypeUnpublish.mockRejectedValue(error);

    const result = await unpublishContentTypeTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error unpublishing content type: Content type is already in draft state',
        },
      ],
    });
  });
});
