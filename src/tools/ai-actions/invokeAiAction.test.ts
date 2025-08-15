import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invokeAiActionTool } from './invokeAiAction.js';
import { formatResponse } from '../../utils/formatters.js';
import { OutputFormat } from '../../utils/ai-actions.js';
import {
  setupMockClient,
  mockAiActionInvoke,
  mockAiActionInvocationGet,
  mockArgs,
  mockInvocationFields,
  mockInvocationStatusResponse,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('invokeAiAction', () => {
  beforeEach(() => {
    setupMockClient();
    // Mock setTimeout to avoid actual delays in tests
    vi.spyOn(global, 'setTimeout').mockImplementation((fn) => {
      if (typeof fn === 'function') fn();
      return 1 as unknown as NodeJS.Timeout;
    });
  });

  it('should invoke an AI action successfully and poll for completion', async () => {
    const testArgs = {
      ...mockArgs,
      fields: mockInvocationFields,
    };

    const mockInvocation = {
      sys: {
        id: 'test-invocation-id',
      },
    };

    // Mock the invoke call
    mockAiActionInvoke.mockResolvedValue(mockInvocation);

    // Mock the polling status check
    mockAiActionInvocationGet.mockResolvedValue(mockInvocationStatusResponse);

    const result = await invokeAiActionTool(testArgs);

    const expectedResponse = formatResponse(
      'AI action invoked and completed successfully',
      {
        aiActions: [
          {
            actionId: 'test-invocation-id',
            content: 'AI action completed successfully',
          },
        ],
        nextStepsGuidance: `Required next step: Now that the invocation is complete, you will take the next step to complete the workflow. This will involve a CRUD operation that will take action on each of the action returned in the aiActions variable. You will need to use the appropriate tool to do this, choose a tool depending on the type of entity the action was executed on and the description of the Ai Action.`,
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

  it('should handle multiple field invocations', async () => {
    const multipleFields = [
      {
        outputFormat: OutputFormat.PLAIN_TEXT,
        variables: [
          {
            id: 'text1',
            value: 'First text',
          },
        ],
      },
      {
        outputFormat: OutputFormat.MARKDOWN,
        variables: [
          {
            id: 'text2',
            value: 'Second text',
          },
        ],
      },
    ];

    const testArgs = {
      ...mockArgs,
      fields: multipleFields,
    };

    const mockInvocations = [
      { sys: { id: 'invocation-1' } },
      { sys: { id: 'invocation-2' } },
    ];

    mockAiActionInvoke
      .mockResolvedValueOnce(mockInvocations[0])
      .mockResolvedValueOnce(mockInvocations[1]);

    mockAiActionInvocationGet
      .mockResolvedValueOnce({
        sys: { id: 'invocation-1', status: 'COMPLETED' },
        result: { content: 'Result 1' },
      })
      .mockResolvedValueOnce({
        sys: { id: 'invocation-2', status: 'COMPLETED' },
        result: { content: 'Result 2' },
      });

    const result = await invokeAiActionTool(testArgs);

    const expectedResponse = formatResponse(
      'AI action invoked and completed successfully',
      {
        aiActions: [
          {
            actionId: 'invocation-1',
            content: 'Result 1',
          },
          {
            actionId: 'invocation-2',
            content: 'Result 2',
          },
        ],
        nextStepsGuidance: `Required next step: Now that the invocation is complete, you will take the next step to complete the workflow. This will involve a CRUD operation that will take action on each of the action returned in the aiActions variable. You will need to use the appropriate tool to do this, choose a tool depending on the type of entity the action was executed on and the description of the Ai Action.`,
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

  it('should handle polling timeout when invocation takes too long', async () => {
    const testArgs = {
      ...mockArgs,
      fields: mockInvocationFields,
    };

    const mockInvocation = {
      sys: {
        id: 'test-invocation-id',
      },
    };

    mockAiActionInvoke.mockResolvedValue(mockInvocation);

    // Mock the status to always return IN_PROGRESS (never completes)
    mockAiActionInvocationGet.mockResolvedValue({
      sys: {
        id: 'test-invocation-id',
        status: 'IN_PROGRESS',
      },
    });

    const result = await invokeAiActionTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error invoking AI action: Polling timeout: 0/1 actions completed after 10 attempts',
        },
      ],
    });
  });

  it('should handle failed invocation status', async () => {
    const testArgs = {
      ...mockArgs,
      fields: mockInvocationFields,
    };

    const mockInvocation = {
      sys: {
        id: 'test-invocation-id',
      },
    };

    mockAiActionInvoke.mockResolvedValue(mockInvocation);

    // Mock the status to return FAILED
    mockAiActionInvocationGet.mockResolvedValue({
      sys: {
        id: 'test-invocation-id',
        status: 'FAILED',
      },
    });

    const result = await invokeAiActionTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error invoking AI action: Polling timeout: 0/1 actions completed after 10 attempts',
        },
      ],
    });
  });

  it('should handle cancelled invocation status', async () => {
    const testArgs = {
      ...mockArgs,
      fields: mockInvocationFields,
    };

    const mockInvocation = {
      sys: {
        id: 'test-invocation-id',
      },
    };

    mockAiActionInvoke.mockResolvedValue(mockInvocation);

    // Mock the status to return CANCELLED
    mockAiActionInvocationGet.mockResolvedValue({
      sys: {
        id: 'test-invocation-id',
        status: 'CANCELLED',
      },
    });

    const result = await invokeAiActionTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error invoking AI action: Polling timeout: 0/1 actions completed after 10 attempts',
        },
      ],
    });
  });

  it('should handle errors during initial invocation', async () => {
    const testArgs = {
      ...mockArgs,
      fields: mockInvocationFields,
    };

    const error = new Error('AI action not found');
    mockAiActionInvoke.mockRejectedValue(error);

    const result = await invokeAiActionTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error invoking AI action: AI action not found',
        },
      ],
    });
  });
});
