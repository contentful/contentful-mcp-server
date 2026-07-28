import { describe, it, expect } from 'vitest';
import { mockFragmentGetMany, mockFragmentsResponse } from './mockClient.js';
import { listFragmentsTool } from './listFragments.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('listFragments', () => {
  const mockConfig = createMockConfig();
  const baseArgs = {
    spaceId: 'test-space-id',
    environmentId: 'test-environment',
  };

  it('lists fragments and clamps limit to 10', async () => {
    mockFragmentGetMany.mockResolvedValue(mockFragmentsResponse);

    const tool = listFragmentsTool(mockConfig);
    const result = await tool({ ...baseArgs, limit: 50 });

    expect(mockFragmentGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10 },
    });
    expect(result.content[0].text).toContain('Fragments retrieved successfully');
  });

  it('forwards cursor and order params', async () => {
    mockFragmentGetMany.mockResolvedValue(mockFragmentsResponse);

    const tool = listFragmentsTool(mockConfig);
    await tool({ ...baseArgs, pageNext: 'cursor-1', order: 'sys.createdAt' });

    expect(mockFragmentGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10, pageNext: 'cursor-1', order: 'sys.createdAt' },
    });
  });

  it('forwards pagePrev cursor param', async () => {
    mockFragmentGetMany.mockResolvedValue(mockFragmentsResponse);

    const tool = listFragmentsTool(mockConfig);
    await tool({ ...baseArgs, pagePrev: 'cursor-back' });

    expect(mockFragmentGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10, pagePrev: 'cursor-back' },
    });
  });

  it('handles errors', async () => {
    mockFragmentGetMany.mockRejectedValue(new Error('boom'));

    const tool = listFragmentsTool(mockConfig);
    const result = await tool(baseArgs);

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error listing fragments: boom' }],
    });
  });
});
