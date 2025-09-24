import { describe, it, expect, beforeEach, vi } from 'vitest';
import { unpublishAiActionTool } from './unpublishAiAction.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockAiActionUnpublish,
  mockArgs,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('unpublishAiAction', () => {
  beforeEach(() => {
    setupMockClient();
  });

  it('should unpublish an AI action successfully', async () => {
    mockAiActionUnpublish.mockResolvedValue(undefined);

    const result = await unpublishAiActionTool(mockArgs);

    const expectedResponse = formatResponse(
      'AI action unpublished successfully',
      {
        aiActionId: 'test-ai-action-id',
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

  it('should handle errors when AI action unpublishing fails', async () => {
    const error = new Error('AI action not found');
    mockAiActionUnpublish.mockRejectedValue(error);

    const result = await unpublishAiActionTool(mockArgs);

    const expectedResponse = formatResponse('AI action unpublish failed', {
      status: error,
      aiActionId: 'test-ai-action-id',
    });
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });
  });

  it('should handle unpublishing an already unpublished AI action', async () => {
    const error = new Error('AI action is not published');
    mockAiActionUnpublish.mockRejectedValue(error);

    const result = await unpublishAiActionTool(mockArgs);

    const expectedResponse = formatResponse('AI action unpublish failed', {
      status: error,
      aiActionId: 'test-ai-action-id',
    });
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });
  });
});
