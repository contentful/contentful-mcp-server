import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockDataAssemblyCreate, mockDataAssembly } from './mockClient.js';
import { createDataAssemblyTool } from './createDataAssembly.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('createDataAssembly', () => {
  const mockConfig = createMockConfig();
  const baseArgs = {
    spaceId: 'test-space-id',
    environmentId: 'test-environment',
    name: 'Test Data Assembly',
    description: 'A test data assembly',
    parameters: {},
    resolvers: {},
    return: {},
    dataType: [],
  };

  beforeEach(() => vi.clearAllMocks());

  it('creates a data assembly successfully', async () => {
    mockDataAssemblyCreate.mockResolvedValue(mockDataAssembly);

    const tool = createDataAssemblyTool(mockConfig);
    const result = await tool(baseArgs);

    expect(mockDataAssemblyCreate).toHaveBeenCalledWith(
      { spaceId: baseArgs.spaceId, environmentId: baseArgs.environmentId },
      expect.objectContaining({
        sys: expect.objectContaining({ type: 'DataAssembly', dataType: [] }),
        name: baseArgs.name,
        description: baseArgs.description,
        parameters: {},
        resolvers: {},
        return: {},
      }),
    );
    expect(result.content[0].text).toContain('Data assembly created successfully');
  });

  it('rejects creates in a protected environment', async () => {
    const tool = createDataAssemblyTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool(baseArgs);
    expect(mockDataAssemblyCreate).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockDataAssemblyCreate.mockRejectedValue(new Error('boom'));
    const tool = createDataAssemblyTool(mockConfig);
    const result = await tool(baseArgs);
    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error creating data assembly: boom' }],
    });
  });
});
