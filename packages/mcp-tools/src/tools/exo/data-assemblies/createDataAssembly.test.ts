import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import {
  mockDataAssemblyCreate,
  mockDataAssembly,
  mockParameters,
} from './mockClient.js';
import { createDataAssemblyTool } from './createDataAssembly.js';
import { createDataAssemblyTools } from './register.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('createDataAssembly', () => {
  const mockConfig = createMockConfig();
  const baseArgs = {
    spaceId: 'test-space-id',
    environmentId: 'test-environment',
    name: 'Test Data Assembly',
    description: 'A test data assembly',
    parameters: [],
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
        parameters: [],
        resolvers: {},
        return: {},
      }),
    );
    expect(result.content[0].text).toContain(
      'Data assembly created successfully',
    );
  });

  it('forwards registered canonical input without changing declaration metadata or order', async () => {
    mockDataAssemblyCreate.mockResolvedValue(mockDataAssembly);
    const registered = createDataAssemblyTools(mockConfig).createDataAssembly;
    const args = z
      .object(registered.inputParams)
      .parse({ ...baseArgs, parameters: mockParameters });

    const result = await registered.tool(args);

    expect(result.isError).not.toBe(true);
    expect(mockDataAssemblyCreate).toHaveBeenCalledWith(
      { spaceId: baseArgs.spaceId, environmentId: baseArgs.environmentId },
      expect.objectContaining({ parameters: mockParameters }),
    );
  });

  it.each([
    { title: { type: 'String', required: true } },
    [{ id: 'title', type: 'String' }],
    [{ id: 'title', type: 'String', required: 'false' }],
  ])(
    'rejects invalid registered parameter input before creating: %j',
    (parameters) => {
      const registered = createDataAssemblyTools(mockConfig).createDataAssembly;
      expect(() =>
        z.object(registered.inputParams).parse({ ...baseArgs, parameters }),
      ).toThrow();
      expect(mockDataAssemblyCreate).not.toHaveBeenCalled();
    },
  );

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
