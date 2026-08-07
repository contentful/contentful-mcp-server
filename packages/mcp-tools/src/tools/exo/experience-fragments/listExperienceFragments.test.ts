import { describe, it, expect } from 'vitest';
import {
  mockExperienceFragmentGetMany,
  mockExperienceFragmentsResponse,
} from './mockClient.js';
import { listExperienceFragmentsTool } from './listExperienceFragments.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('listExperienceFragments', () => {
  const mockConfig = createMockConfig();
  const baseArgs = {
    spaceId: 'test-space-id',
    environmentId: 'test-environment',
  };

  it('lists experience fragments and clamps limit to 10', async () => {
    mockExperienceFragmentGetMany.mockResolvedValue(
      mockExperienceFragmentsResponse,
    );

    const tool = listExperienceFragmentsTool(mockConfig);
    const result = await tool({ ...baseArgs, limit: 50 });

    expect(mockExperienceFragmentGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10 },
    });
    expect(result.content[0].text).toContain(
      'ExperienceFragments retrieved successfully',
    );
  });

  it('forwards cursor and order params', async () => {
    mockExperienceFragmentGetMany.mockResolvedValue(
      mockExperienceFragmentsResponse,
    );

    const tool = listExperienceFragmentsTool(mockConfig);
    await tool({ ...baseArgs, pageNext: 'cursor-1', order: 'sys.createdAt' });

    expect(mockExperienceFragmentGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10, pageNext: 'cursor-1', order: 'sys.createdAt' },
    });
  });

  it('forwards pagePrev cursor param', async () => {
    mockExperienceFragmentGetMany.mockResolvedValue(
      mockExperienceFragmentsResponse,
    );

    const tool = listExperienceFragmentsTool(mockConfig);
    await tool({ ...baseArgs, pagePrev: 'cursor-back' });

    expect(mockExperienceFragmentGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10, pagePrev: 'cursor-back' },
    });
  });

  it('handles errors', async () => {
    mockExperienceFragmentGetMany.mockRejectedValue(new Error('boom'));

    const tool = listExperienceFragmentsTool(mockConfig);
    const result = await tool(baseArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error listing experience fragments: boom' },
      ],
    });
  });
});
