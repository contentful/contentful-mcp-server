import { describe, it, expect, beforeEach, vi } from 'vitest';
import { publishAiActionTool } from './publishAiAction.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockAiActionGet,
  mockAiActionPublish,
  mockAiAction,
  mockPublishedAiAction,
  mockArgs,
} from './mockClient.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

vi.mock('../../../src/utils/tools.js');

describe('publishAiAction', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
  });

  it('should publish an AI action successfully', async () => {
    mockAiActionGet.mockResolvedValue(mockAiAction);
    mockAiActionPublish.mockResolvedValue(mockPublishedAiAction);

    const tool = publishAiActionTool(mockConfig);
    const result = await tool(mockArgs);

    const expectedResponse = formatResponse(
      'AI action published successfully',
      {
        version: mockPublishedAiAction.sys.publishedVersion,
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

  it('should handle errors when AI action publishing fails', async () => {
    const error = new Error('AI action not found');
    mockAiActionGet.mockRejectedValue(error);

    const tool = publishAiActionTool(mockConfig);
    const result = await tool(mockArgs);

    const expectedResponse = formatResponse('AI action publish failed', {
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

  it('should handle publishing an already published AI action', async () => {
    // This should still succeed and return the published version
    mockAiActionGet.mockResolvedValue(mockAiAction);
    mockAiActionPublish.mockResolvedValue(mockPublishedAiAction);

    const tool = publishAiActionTool(mockConfig);
    const result = await tool(mockArgs);

    const expectedResponse = formatResponse(
      'AI action published successfully',
      {
        version: mockPublishedAiAction.sys.publishedVersion,
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
});
