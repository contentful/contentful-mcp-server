import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getReleaseActionTool } from './getReleaseAction.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockReleaseActionGet,
  mockArgs,
  mockReleaseAction,
} from './mockClient.js';

vi.mock('../../utils/tools.js');
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('getReleaseAction', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  it('should retrieve a release action successfully', async () => {
    mockReleaseActionGet.mockResolvedValue(mockReleaseAction);

    const tool = getReleaseActionTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      actionId: 'test-release-action-id',
    });

    const expectedResponse = formatResponse(
      'Release action retrieved successfully',
      {
        releaseAction: mockReleaseAction,
      },
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });

    expect(mockReleaseActionGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      releaseId: mockArgs.releaseId,
      actionId: 'test-release-action-id',
    });
  });

  it('should handle errors when release action retrieval fails', async () => {
    mockReleaseActionGet.mockRejectedValue(
      new Error('Release action not found'),
    );

    const tool = getReleaseActionTool(mockConfig);
    const result = await tool({ ...mockArgs, actionId: 'missing-id' });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving release action: Release action not found',
        },
      ],
    });
  });
});
