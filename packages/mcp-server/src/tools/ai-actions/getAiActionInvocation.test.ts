import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAiActionInvocationTool } from './getAiActionInvocation.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockAiActionInvocationGet,
  mockAiActionInvocation,
  mockArgs,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('getAiActionInvocation', () => {
  beforeEach(() => {
    setupMockClient();
  });

  it('should retrieve an AI action invocation successfully', async () => {
    const testArgs = {
      ...mockArgs,
      invocationId: 'test-invocation-id',
    };

    mockAiActionInvocationGet.mockResolvedValue(mockAiActionInvocation);

    const result = await getAiActionInvocationTool(testArgs);

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

    const result = await getAiActionInvocationTool(testArgs);

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
