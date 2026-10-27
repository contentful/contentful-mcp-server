import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockDataAssemblyCreate,
  mockDataAssembly,
  mockParameters,
} from './mockClient.js';
import {
  createDataAssemblyTool,
  CreateDataAssemblyToolParams,
} from './createDataAssembly.js';
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
    resolvers: {
      article: {
        source: 'Contentful:GraphQL' as const,
        query: 'query { article { title } }',
      },
    },
    return: { title: { $from: 'article.title' } },
  };

  beforeEach(() => vi.clearAllMocks());

  it('accepts sys-free configuration', () => {
    expect(CreateDataAssemblyToolParams.safeParse(baseArgs).success).toBe(true);
  });

  it('creates a data assembly successfully', async () => {
    mockDataAssemblyCreate.mockResolvedValue({
      ...mockDataAssembly,
      sys: { ...mockDataAssembly.sys, id: 'generated-id' },
    });

    const tool = createDataAssemblyTool(mockConfig);
    const result = await tool(baseArgs);

    expect(mockDataAssemblyCreate).toHaveBeenCalledWith(
      `/spaces/${baseArgs.spaceId}/environments/${baseArgs.environmentId}/data_assemblies`,
      {
        name: baseArgs.name,
        description: baseArgs.description,
        parameters: [],
        resolvers: baseArgs.resolvers,
        return: baseArgs.return,
        metadata: { tags: [] },
      },
    );
    expect(result.content[0].text).toContain(
      'Data assembly created successfully',
    );
    expect(result.content[0].text).toContain('generated-id');
  });

  it.each([
    ['dataType', []],
    ['variant', 'legacy-variant'],
    ['sys', { type: 'DataAssembly', dataType: [] }],
  ])('rejects the obsolete %s argument', (field, value) => {
    const registered = createDataAssemblyTools(mockConfig).createDataAssembly;
    expect(
      registered.inputParams.safeParse({ ...baseArgs, [field]: value }).success,
    ).toBe(false);
  });

  it('forwards registered canonical input without changing declaration metadata or order', async () => {
    mockDataAssemblyCreate.mockResolvedValue(mockDataAssembly);
    const registered = createDataAssemblyTools(mockConfig).createDataAssembly;
    const args = registered.inputParams.parse({
      ...baseArgs,
      parameters: mockParameters,
    });

    const result = await registered.tool(args);

    expect(result.isError).not.toBe(true);
    expect(mockDataAssemblyCreate).toHaveBeenCalledWith(
      `/spaces/${baseArgs.spaceId}/environments/${baseArgs.environmentId}/data_assemblies`,
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
        registered.inputParams.parse({ ...baseArgs, parameters }),
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
