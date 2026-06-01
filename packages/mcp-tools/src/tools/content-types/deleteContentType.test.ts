import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockContentTypeDelete,
  mockContentTypeGet,
  mockContentType,
  mockArgs,
} from './mockClient.js';
import { deleteContentTypeTool } from './deleteContentType.js';
import { formatResponse } from '../../utils/formatters.js';
import { buildConfirmToken } from '../../utils/confirmation.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('deleteContentType', () => {
  const mockConfig = createMockConfig();
  const validToken = buildConfirmToken(
    'contentType',
    mockArgs.contentTypeId,
    mockContentType.sys.version,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a confirmation preview when confirm is missing', async () => {
    mockContentTypeGet.mockResolvedValue(mockContentType);

    const tool = deleteContentTypeTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockContentTypeDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
    expect(result.content[0].text).toContain(validToken);
  });

  it('returns a confirmation preview when confirmToken is wrong', async () => {
    mockContentTypeGet.mockResolvedValue(mockContentType);

    const tool = deleteContentTypeTool(mockConfig);
    const result = await tool({ ...mockArgs, confirm: true, confirmToken: 'wrong' });

    expect(mockContentTypeDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('returns a confirmation preview when confirm is true but confirmToken is missing', async () => {
    mockContentTypeGet.mockResolvedValue(mockContentType);

    const tool = deleteContentTypeTool(mockConfig);
    const result = await tool({ ...mockArgs, confirm: true });

    expect(mockContentTypeDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('returns a confirmation preview when confirm is false even with correct token', async () => {
    mockContentTypeGet.mockResolvedValue(mockContentType);

    const tool = deleteContentTypeTool(mockConfig);
    const result = await tool({ ...mockArgs, confirm: false, confirmToken: validToken });

    expect(mockContentTypeDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('deletes when confirm is true and confirmToken matches', async () => {
    mockContentTypeGet.mockResolvedValue(mockContentType);
    mockContentTypeDelete.mockResolvedValue(undefined);

    const tool = deleteContentTypeTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: validToken,
    });

    expect(mockContentTypeDelete).toHaveBeenCalledOnce();
    const expected = formatResponse('Content type deleted successfully', {
      contentTypeId: mockArgs.contentTypeId,
    });
    expect(result).toEqual({ content: [{ type: 'text', text: expected }] });
  });

  it('handles errors when content type get fails before confirmation', async () => {
    mockContentTypeGet.mockRejectedValue(new Error('Content type not found'));

    const tool = deleteContentTypeTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error deleting content type: Content type not found' },
      ],
    });
  });

  it('handles errors when deletion fails after confirmation', async () => {
    mockContentTypeGet.mockResolvedValue(mockContentType);
    mockContentTypeDelete.mockRejectedValue(new Error('Content type deletion failed'));

    const tool = deleteContentTypeTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: validToken,
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error deleting content type: Content type deletion failed',
        },
      ],
    });
  });
});
