import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAiActionInvocationTool } from './getAiActionInvocation.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockAiActionInvocationGet,
  mockAiActionInvocation,
  mockArgs,
} from './mockClient.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

vi.mock('../../../src/utils/tools.js');

describe('getAiActionInvocation', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
  });

  it('should retrieve an AI action invocation successfully', async () => {
    const testArgs = {
      ...mockArgs,
      invocationId: 'test-invocation-id',
    };

    mockAiActionInvocationGet.mockResolvedValue(mockAiActionInvocation);

    const tool = getAiActionInvocationTool(mockConfig);
    const result = await tool(testArgs);

    const expectedResponse = formatResponse(
      'AI action invocation retrieved successfully',
      {
        aiActionInvocation: mockAiActionInvocation,
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

  it('should handle errors when invocation is not found', async () => {
    const testArgs = {
      ...mockArgs,
      invocationId: 'non-existent-invocation',
    };

    const error = new Error('Invocation not found');
    mockAiActionInvocationGet.mockRejectedValue(error);

    const tool = getAiActionInvocationTool(mockConfig);
    const result = await tool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving AI action invocation: Invocation not found',
        },
      ],
    });
  });
});
