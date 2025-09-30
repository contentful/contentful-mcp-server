import { describe, it, expect } from 'vitest';
import {
  mockContentTypeUnpublish,
  mockContentType,
  mockArgs,
} from './mockClient.js';
import { unpublishContentTypeTool } from './unpublishContentType.js';
import { formatResponse } from '../../utils/formatters.js';

describe('unpublishContentType', () => {
  it('should unpublish a content type successfully', async () => {
    const unpublishedContentType = {
      ...mockContentType,
      sys: {
        ...mockContentType.sys,
        version: 3,
        // publishedVersion is removed when unpublished
      },
    };

    mockContentTypeUnpublish.mockResolvedValue(unpublishedContentType);

    const result = await unpublishContentTypeTool(mockArgs);

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
    const alreadyUnpublishedContentType = {
      ...mockContentType,
      sys: {
        ...mockContentType.sys,
        version: 1,
        // No publishedVersion indicates it's already unpublished
      },
    };

    mockContentTypeUnpublish.mockResolvedValue(alreadyUnpublishedContentType);

    const result = await unpublishContentTypeTool(mockArgs);

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

  it('should handle errors when unpublishing content type fails', async () => {
    const error = new Error('Unpublish failed');
    mockContentTypeUnpublish.mockRejectedValue(error);

    const result = await unpublishContentTypeTool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error unpublishing content type: Unpublish failed',
        },
      ],
    });
  });
});
