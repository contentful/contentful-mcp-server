import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getReleaseTool } from './getRelease.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockReleaseGet,
  mockArgs,
  mockRelease,
} from './mockClient.js';

vi.mock('../../utils/tools.js');
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('getRelease', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  it('should retrieve a release successfully', async () => {
    mockReleaseGet.mockResolvedValue(mockRelease);

    const tool = getReleaseTool(mockConfig);
    const result = await tool(mockArgs);

    const expectedResponse = formatResponse('Release retrieved successfully', {
      release: mockRelease,
    });
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });

    expect(mockReleaseGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      releaseId: mockArgs.releaseId,
    });
  });

  it('should handle errors when release retrieval fails', async () => {
    const error = new Error('Release not found');
    mockReleaseGet.mockRejectedValue(error);

    const tool = getReleaseTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving release: Release not found',
        },
      ],
    });
  });
});
