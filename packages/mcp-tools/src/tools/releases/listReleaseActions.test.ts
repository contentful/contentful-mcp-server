import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listReleaseActionsTool } from './listReleaseActions.js';
import {
  setupMockClient,
  mockReleaseActionGetMany,
  mockReleaseActionsResponse,
} from './mockClient.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

vi.mock('../../utils/tools.js');

describe('listReleaseActions', () => {
  const mockConfig = createMockConfig();
  const baseArgs = {
    spaceId: 'test-space-id',
    environmentId: 'test-environment',
  };

  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  it('lists release actions with no filters', async () => {
    mockReleaseActionGetMany.mockResolvedValue(mockReleaseActionsResponse);

    const tool = listReleaseActionsTool(mockConfig);
    const result = await tool(baseArgs);

    expect(mockReleaseActionGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10 },
    });
    expect(result.content[0].text).toContain(
      'Release actions retrieved successfully',
    );
  });

  it('forwards releaseId, action, and status filters', async () => {
    mockReleaseActionGetMany.mockResolvedValue(mockReleaseActionsResponse);

    const tool = listReleaseActionsTool(mockConfig);
    await tool({
      ...baseArgs,
      releaseId: 'release-1,release-2',
      action: 'publish' as const,
      statusIn: 'succeeded',
      statusNin: 'failed',
    });

    expect(mockReleaseActionGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: {
        limit: 10,
        'sys.release.sys.id[in]': 'release-1,release-2',
        action: 'publish',
        'sys.status[in]': 'succeeded',
        'sys.status[nin]': 'failed',
      },
    });
  });

  it('clamps limit to 10', async () => {
    mockReleaseActionGetMany.mockResolvedValue(mockReleaseActionsResponse);

    const tool = listReleaseActionsTool(mockConfig);
    await tool({ ...baseArgs, limit: 25 });

    expect(mockReleaseActionGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10 },
    });
  });

  it('clamps non-positive limits to one item', async () => {
    mockReleaseActionGetMany.mockResolvedValue(mockReleaseActionsResponse);

    const tool = listReleaseActionsTool(mockConfig);
    await tool({ ...baseArgs, limit: -5 });

    expect(mockReleaseActionGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 1 },
    });
  });

  it('handles errors', async () => {
    mockReleaseActionGetMany.mockRejectedValue(new Error('boom'));

    const tool = listReleaseActionsTool(mockConfig);
    const result = await tool(baseArgs);

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error listing release actions: boom' }],
    });
  });
});
