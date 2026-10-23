import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockDataAssemblyCreate, mockDataAssembly } from './mockClient.js';
import {
  createDataAssemblyTool,
  CreateDataAssemblyToolParams,
} from './createDataAssembly.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('createDataAssembly', () => {
  const mockConfig = createMockConfig();
  const baseArgs = {
    spaceId: 'test-space-id',
    environmentId: 'test-environment',
    name: 'Test Data Assembly',
    description: 'A test data assembly',
    parameters: {},
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
      { spaceId: baseArgs.spaceId, environmentId: baseArgs.environmentId },
      {
        name: baseArgs.name,
        description: baseArgs.description,
        parameters: {},
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
    expect(
      CreateDataAssemblyToolParams.safeParse({ ...baseArgs, [field]: value })
        .success,
    ).toBe(false);
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
