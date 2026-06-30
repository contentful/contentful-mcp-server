import { describe, it, expect } from 'vitest';
import { mockDataAssemblyGetManyPublished, mockDataAssembliesResponse } from './mockClient.js';
import { listPublishedDataAssembliesTool } from './listPublishedDataAssemblies.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('listPublishedDataAssemblies', () => {
  const mockConfig = createMockConfig();
  const baseArgs = {
    spaceId: 'test-space-id',
    environmentId: 'test-environment',
  };

  it('lists published data assemblies and clamps limit to 10', async () => {
    mockDataAssemblyGetManyPublished.mockResolvedValue(mockDataAssembliesResponse);

    const tool = listPublishedDataAssembliesTool(mockConfig);
    const result = await tool({ ...baseArgs, limit: 50 });

    expect(mockDataAssemblyGetManyPublished).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10 },
    });
    expect(result.content[0].text).toContain('Published data assemblies retrieved successfully');
  });

  it('forwards cursor params', async () => {
    mockDataAssemblyGetManyPublished.mockResolvedValue(mockDataAssembliesResponse);

    const tool = listPublishedDataAssembliesTool(mockConfig);
    await tool({ ...baseArgs, pageNext: 'cursor-1' });

    expect(mockDataAssemblyGetManyPublished).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10, pageNext: 'cursor-1' },
    });
  });

  it('handles errors', async () => {
    mockDataAssemblyGetManyPublished.mockRejectedValue(new Error('boom'));

    const tool = listPublishedDataAssembliesTool(mockConfig);
    const result = await tool(baseArgs);

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error listing published data assemblies: boom' }],
    });
  });
});
