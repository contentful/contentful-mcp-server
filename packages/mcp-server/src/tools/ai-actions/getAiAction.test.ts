import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAiActionTool } from './getAiAction.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockAiActionGet,
  mockAiAction,
  mockArgs,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('getAiAction', () => {
  beforeEach(() => {
    setupMockClient();
  });

  it('should retrieve an AI action successfully', async () => {
    mockAiActionGet.mockResolvedValue(mockAiAction);

    const result = await getAiActionTool(mockArgs);

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

    const result = await getAiActionTool(mockArgs);

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
