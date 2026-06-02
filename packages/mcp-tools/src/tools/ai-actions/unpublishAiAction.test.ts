import { describe, it, expect, beforeEach, vi } from 'vitest';
import { unpublishAiActionTool } from './unpublishAiAction.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockAiActionUnpublish,
  mockArgs,
} from './mockClient.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

vi.mock('../../utils/tools.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../utils/tools.js')>();
  return { ...orig, createToolClient: vi.fn() };
});

describe('unpublishAiAction', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
  });

  it('should unpublish an AI action successfully', async () => {
    mockAiActionUnpublish.mockResolvedValue(undefined);

    const tool = unpublishAiActionTool(mockConfig);
    const result = await tool(mockArgs);

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

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = unpublishAiActionTool(protectedConfig);
    const result = await tool({ ...mockArgs, environmentId: 'master' });
    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error unpublishing AI action: Environment 'master' is protected. Destructive operations are not allowed.",
        },
      ],
    });
  });

  it('should handle errors when AI action unpublishing fails', async () => {
    const error = new Error('AI action not found');
    mockAiActionUnpublish.mockRejectedValue(error);

    const tool = unpublishAiActionTool(mockConfig);
    const result = await tool(mockArgs);

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

    const tool = unpublishAiActionTool(mockConfig);
    const result = await tool(mockArgs);

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
