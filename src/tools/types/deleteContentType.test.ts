import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deleteContentTypeTool } from './deleteContentType.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockContentTypeDelete,
  mockArgs,
} from './mockUtil.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('deleteContentType', () => {
  beforeEach(() => {
    setupMockClient();
  });

  it('should delete a content type successfully', async () => {
    mockContentTypeDelete.mockResolvedValue(undefined);

    const result = await deleteContentTypeTool(mockArgs);

    const expectedResponse = formatResponse(
      'Content type deleted successfully',
      {
        contentTypeId: mockArgs.contentTypeId,
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
    const error = new Error('Content type not found');
    mockContentTypeDelete.mockRejectedValue(error);

    const result = await deleteContentTypeTool(mockArgs);

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
    const error = new Error('Cannot delete content type with existing entries');
    mockContentTypeDelete.mockRejectedValue(error);

    const result = await deleteContentTypeTool(mockArgs);

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
    const error = new Error('Cannot delete published content type');
    mockContentTypeDelete.mockRejectedValue(error);

    const result = await deleteContentTypeTool(mockArgs);

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
