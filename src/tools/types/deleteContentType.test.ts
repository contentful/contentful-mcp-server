import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deleteContentTypeTool } from './deleteContentType.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockContentTypeDelete,
  mockArgs,
} from './mockUtil.js';
import { createToolClient } from '../../utils/tools.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('deleteContentType', () => {
  beforeEach(() => {
    setupMockClient();
  });

  it('should delete a content type successfully', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'test-content-type-id',
    };

    mockContentTypeDelete.mockResolvedValue(undefined);

    const result = await deleteContentTypeTool(testArgs);

    expect(createToolClient).toHaveBeenCalledWith(testArgs);
    expect(mockContentTypeDelete).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      contentTypeId: testArgs.contentTypeId,
    });

    const expectedResponse = formatResponse(
      'Content type deleted successfully',
      {
        contentTypeId: testArgs.contentTypeId,
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

  it('should handle errors when content type deletion fails due to non-existent content type', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'non-existent-content-type',
    };

    const error = new Error('Content type not found');
    mockContentTypeDelete.mockRejectedValue(error);

    const result = await deleteContentTypeTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error deleting content type: Content type not found',
        },
      ],
    });
  });

  it('should handle errors when content type has existing entries', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'content-type-with-entries',
    };

    const error = new Error('Cannot delete content type with existing entries');
    mockContentTypeDelete.mockRejectedValue(error);

    const result = await deleteContentTypeTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error deleting content type: Cannot delete content type with existing entries',
        },
      ],
    });
  });

  it('should handle errors when content type is published', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'published-content-type',
    };

    const error = new Error('Cannot delete published content type');
    mockContentTypeDelete.mockRejectedValue(error);

    const result = await deleteContentTypeTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error deleting content type: Cannot delete published content type',
        },
      ],
    });
  });
});
