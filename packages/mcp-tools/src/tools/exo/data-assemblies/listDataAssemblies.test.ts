import { describe, it, expect } from 'vitest';
import { mockDataAssemblyGetMany, mockDataAssembliesResponse } from './mockClient.js';
import { listDataAssembliesTool } from './listDataAssemblies.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('listDataAssemblies', () => {
  const mockConfig = createMockConfig();
  const baseArgs = {
    spaceId: 'test-space-id',
    environmentId: 'test-environment',
  };

  it('lists data assemblies and clamps limit to 10', async () => {
    mockDataAssemblyGetMany.mockResolvedValue(mockDataAssembliesResponse);

    const tool = listDataAssembliesTool(mockConfig);
    const result = await tool({ ...baseArgs, limit: 50 });

    expect(mockDataAssemblyGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10 },
    });
    expect(result.content[0].text).toContain('Data assemblies retrieved successfully');
  });

  it('forwards cursor params', async () => {
    mockDataAssemblyGetMany.mockResolvedValue(mockDataAssembliesResponse);

    const tool = listDataAssembliesTool(mockConfig);
    await tool({ ...baseArgs, pageNext: 'cursor-1' });

    expect(mockDataAssemblyGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10, pageNext: 'cursor-1' },
    });
  });

  it('forwards pagePrev cursor param', async () => {
    mockDataAssemblyGetMany.mockResolvedValue(mockDataAssembliesResponse);

    const tool = listDataAssembliesTool(mockConfig);
    await tool({ ...baseArgs, pagePrev: 'cursor-back' });

    expect(mockDataAssemblyGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10, pagePrev: 'cursor-back' },
    });
  });

  it('forwards sysIdIn filter', async () => {
    mockDataAssemblyGetMany.mockResolvedValue(mockDataAssembliesResponse);

    const tool = listDataAssembliesTool(mockConfig);
    await tool({ ...baseArgs, sysIdIn: 'id1,id2' });

    expect(mockDataAssemblyGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10, 'sys.id[in]': 'id1,id2' },
    });
  });

  it('handles errors', async () => {
    mockDataAssemblyGetMany.mockRejectedValue(new Error('boom'));

    const tool = listDataAssembliesTool(mockConfig);
    const result = await tool(baseArgs);

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error listing data assemblies: boom' }],
    });
  });
});
