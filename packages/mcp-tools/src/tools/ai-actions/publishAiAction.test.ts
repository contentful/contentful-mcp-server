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

vi.mock('../../utils/tools.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../utils/tools.js')>();
  return { ...orig, createToolClient: vi.fn() };
});

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

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = publishAiActionTool(protectedConfig);
    const result = await tool({ ...mockArgs, environmentId: 'master' });
    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error publishing AI action: Environment 'master' is protected. Write and delete operations are not allowed.",
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
