import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listReleasesTool } from './listReleases.js';
import {
  setupMockClient,
  mockReleaseQuery,
  mockReleasesResponse,
} from './mockClient.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

vi.mock('../../utils/tools.js');

describe('listReleases', () => {
  const mockConfig = createMockConfig();
  const baseArgs = {
    spaceId: 'test-space-id',
    environmentId: 'test-environment',
  };

  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  it('lists releases with default parameters', async () => {
    mockReleaseQuery.mockResolvedValue(mockReleasesResponse);

    const tool = listReleasesTool(mockConfig);
    const result = await tool(baseArgs);

    expect(mockReleaseQuery).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10 },
    });
    expect(result.content[0].text).toContain('Releases retrieved successfully');
  });

  it('forwards pageNext and pagePrev cursors', async () => {
    mockReleaseQuery.mockResolvedValue(mockReleasesResponse);

    const tool = listReleasesTool(mockConfig);
    await tool({ ...baseArgs, pageNext: 'cursor-1' });

    expect(mockReleaseQuery).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10, pageNext: 'cursor-1' },
    });

    vi.clearAllMocks();
    mockReleaseQuery.mockResolvedValue(mockReleasesResponse);
    await tool({ ...baseArgs, pagePrev: 'cursor-back' });

    expect(mockReleaseQuery).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10, pagePrev: 'cursor-back' },
    });
  });

  it('forwards status, title, and entity filters', async () => {
    mockReleaseQuery.mockResolvedValue(mockReleasesResponse);

    const tool = listReleasesTool(mockConfig);
    await tool({
      ...baseArgs,
      statusIn: 'active',
      statusNin: 'archived',
      titleMatch: 'Black Friday',
      entitiesLinkType: 'Entry',
      entitiesSysIdIn: 'id1,id2',
    });

    expect(mockReleaseQuery).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: {
        limit: 10,
        'sys.status[in]': 'active',
        'sys.status[nin]': 'archived',
        'title[match]': 'Black Friday',
        'entities.sys.linkType': 'Entry',
        'entities.sys.id[in]': 'id1,id2',
      },
    });
  });

  it('clamps limit to 10', async () => {
    mockReleaseQuery.mockResolvedValue(mockReleasesResponse);

    const tool = listReleasesTool(mockConfig);
    await tool({ ...baseArgs, limit: 100 });

    expect(mockReleaseQuery).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10 },
    });
  });

  it('handles errors', async () => {
    mockReleaseQuery.mockRejectedValue(new Error('boom'));

    const tool = listReleasesTool(mockConfig);
    const result = await tool(baseArgs);

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error listing releases: boom' }],
    });
  });
});
