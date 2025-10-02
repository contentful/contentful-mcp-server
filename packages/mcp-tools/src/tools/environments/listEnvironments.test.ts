import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockArgs,
  testEnvironment,
  mockEnvironmentGetMany,
} from './mockClient.js';
import { listEnvironmentsTool } from './listEnvironments.js';
import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';
import { summarizeData } from '../../utils/summarizer.js';

const mockEnvironments = {
  items: [
    testEnvironment,
    {
      ...testEnvironment,
      sys: { ...testEnvironment.sys, id: 'test-environment-id-2' },
    },
  ],
  total: 2,
  limit: 10,
  skip: 0,
};

describe('listEnvironmentsTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list environments successfully', async () => {
    mockEnvironmentGetMany.mockResolvedValue(mockEnvironments);

    const result = await listEnvironmentsTool(mockArgs);

    const clientArgs = {
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
    };

    expect(createToolClient).toHaveBeenCalledWith(clientArgs);
    expect(mockEnvironmentGetMany).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      query: {
        limit: 10,
        skip: 0,
      },
    });

    const summarizedEnvironments = mockEnvironments.items.map(
      (environment) => ({
        id: environment.sys.id,
        name: environment.name,
        status: 'unknown',
        createdAt: environment.sys.createdAt,
        updatedAt: environment.sys.updatedAt,
      }),
    );

    const summarized = summarizeData(
      {
        ...mockEnvironments,
        items: summarizedEnvironments,
      },
      {
        maxItems: 10,
        remainingMessage:
          'To see more environments, please ask me to retrieve the next page using the skip parameter.',
      },
    );

    const expectedResponse = formatResponse(
      'Environments retrieved successfully',
      {
        environments: summarized,
        total: mockEnvironments.total,
        limit: mockEnvironments.limit,
        skip: mockEnvironments.skip,
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

  it('should handle errors when listing environments fails', async () => {
    const error = new Error('Listing failed');
    mockEnvironmentGetMany.mockRejectedValue(error);

    const result = await listEnvironmentsTool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error listing environments: Listing failed',
        },
      ],
    });
  });
});
