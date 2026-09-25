import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listScheduledActionsTool } from './listScheduledActions.js';
import {
  setupMockClient,
  mockScheduledActionGetMany,
  mockScheduledActionsResponse,
} from './mockClient.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

vi.mock('../../utils/tools.js');

describe('listScheduledActions', () => {
  const mockConfig = createMockConfig();
  const baseArgs = {
    spaceId: 'test-space-id',
    environmentId: 'test-environment',
  };

  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  it('lists scheduled actions with no filters', async () => {
    mockScheduledActionGetMany.mockResolvedValue(mockScheduledActionsResponse);

    const tool = listScheduledActionsTool(mockConfig);
    const result = await tool(baseArgs);

    expect(mockScheduledActionGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      query: {
        'environment.sys.id': baseArgs.environmentId,
        limit: 10,
      },
    });
    expect(result.content[0].text).toContain(
      'Scheduled actions retrieved successfully',
    );
  });

  it('forwards releaseId and status filters', async () => {
    mockScheduledActionGetMany.mockResolvedValue(mockScheduledActionsResponse);

    const tool = listScheduledActionsTool(mockConfig);
    await tool({
      ...baseArgs,
      releaseId: 'release-1',
      statusIn: 'scheduled',
      statusNin: 'canceled',
    });

    expect(mockScheduledActionGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      query: {
        'environment.sys.id': baseArgs.environmentId,
        limit: 10,
        'entity.sys.id': 'release-1',
        'sys.status[in]': 'scheduled',
        'sys.status[nin]': 'canceled',
      },
    });
  });

  it('clamps limit to 10', async () => {
    mockScheduledActionGetMany.mockResolvedValue(mockScheduledActionsResponse);

    const tool = listScheduledActionsTool(mockConfig);
    await tool({ ...baseArgs, limit: 25 });

    expect(mockScheduledActionGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      query: { 'environment.sys.id': baseArgs.environmentId, limit: 10 },
    });
  });

  it('clamps non-positive limits to one item', async () => {
    mockScheduledActionGetMany.mockResolvedValue(mockScheduledActionsResponse);

    const tool = listScheduledActionsTool(mockConfig);
    await tool({ ...baseArgs, limit: -5 });

    expect(mockScheduledActionGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      query: { 'environment.sys.id': baseArgs.environmentId, limit: 1 },
    });
  });

  it('handles errors', async () => {
    mockScheduledActionGetMany.mockRejectedValue(new Error('boom'));

    const tool = listScheduledActionsTool(mockConfig);
    const result = await tool(baseArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error listing scheduled actions: boom' },
      ],
    });
  });
});
