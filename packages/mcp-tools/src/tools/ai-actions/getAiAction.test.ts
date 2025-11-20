import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAiActionTool } from './getAiAction.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockAiActionGet,
  mockAiAction,
  mockArgs,
} from './mockClient.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

vi.mock('../../utils/tools.js');

describe('getAiAction', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
  });

  it('should retrieve an AI action successfully', async () => {
    mockAiActionGet.mockResolvedValue(mockAiAction);

    const tool = getAiActionTool(mockConfig);
    const result = await tool(mockArgs);

    const expectedResponse = formatResponse(
      'AI action retrieved successfully',
      {
        aiAction: mockAiAction,
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

  it('should handle errors when AI action is not found', async () => {
    const error = new Error('AI action not found');
    mockAiActionGet.mockRejectedValue(error);

    const tool = getAiActionTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving AI action: AI action not found',
        },
      ],
    });
  });
});
