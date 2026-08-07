import { describe, it, expect } from 'vitest';
import { mockComponentGetMany, mockComponentsResponse } from './mockClient.js';
import { listComponentsTool } from './listComponents.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('listComponents', () => {
  const mockConfig = createMockConfig();
  const baseArgs = {
    spaceId: 'test-space-id',
    environmentId: 'test-environment',
  };

  it('lists components and clamps limit to 10', async () => {
    mockComponentGetMany.mockResolvedValue(mockComponentsResponse);

    const tool = listComponentsTool(mockConfig);
    const result = await tool({ ...baseArgs, limit: 50 });

    expect(mockComponentGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10 },
    });
    expect(result.content[0].text).toContain(
      'Components retrieved successfully',
    );
  });

  it('forwards cursor and order params', async () => {
    mockComponentGetMany.mockResolvedValue(mockComponentsResponse);

    const tool = listComponentsTool(mockConfig);
    await tool({ ...baseArgs, pageNext: 'cursor-1', order: 'sys.createdAt' });

    expect(mockComponentGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10, pageNext: 'cursor-1', order: 'sys.createdAt' },
    });
  });

  it('forwards pagePrev cursor param', async () => {
    mockComponentGetMany.mockResolvedValue(mockComponentsResponse);

    const tool = listComponentsTool(mockConfig);
    await tool({ ...baseArgs, pagePrev: 'cursor-back' });

    expect(mockComponentGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10, pagePrev: 'cursor-back' },
    });
  });

  it('handles errors', async () => {
    mockComponentGetMany.mockRejectedValue(new Error('boom'));

    const tool = listComponentsTool(mockConfig);
    const result = await tool(baseArgs);

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error listing components: boom' }],
    });
  });
});
