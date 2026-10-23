import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockDataAssemblyGet,
  mockDataAssemblyUpdate,
  mockDataAssembly,
  mockArgs,
} from './mockClient.js';
import {
  updateDataAssemblyTool,
  UpdateDataAssemblyToolParams,
} from './updateDataAssembly.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('updateDataAssembly', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('accepts a partial sys-free update', () => {
    expect(
      UpdateDataAssemblyToolParams.safeParse({
        ...mockArgs,
        version: 1,
        name: 'Updated Data Assembly',
      }).success,
    ).toBe(true);
  });

  it('reads before writing and merges fields', async () => {
    const current = {
      ...mockDataAssembly,
      sys: {
        ...mockDataAssembly.sys,
        variant: 'legacy-variant',
        dataType: [{ id: 'title', name: 'Title', type: 'String' }],
      },
      parameters: {
        article: {
          type: 'ResourceLink',
          linkType: 'Contentful:Entry',
          allowedResources: [],
        },
      },
      resolvers: {
        nested: {
          source: 'Contentful:DataAssembly',
          dataAssembly: {
            sys: {
              type: 'ResourceLink',
              linkType: 'Contentful:DataAssembly',
              urn: 'crn:contentful:content:spaces/test/environments/master/data_assemblies/nested',
            },
          },
        },
      },
      return: { title: { $from: 'nested.title' } },
    };
    mockDataAssemblyGet.mockResolvedValue(current);
    mockDataAssemblyUpdate.mockResolvedValue({
      ...mockDataAssembly,
      name: 'Updated Data Assembly',
      sys: { ...mockDataAssembly.sys, version: 2 },
    });

    const tool = updateDataAssemblyTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      version: 1,
      name: 'Updated Data Assembly',
    });

    expect(mockDataAssemblyGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      dataAssemblyId: mockArgs.dataAssemblyId,
    });
    expect(mockDataAssemblyUpdate).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
        dataAssemblyId: mockArgs.dataAssemblyId,
        version: 1,
      },
      {
        name: 'Updated Data Assembly',
        description: current.description,
        parameters: current.parameters,
        resolvers: current.resolvers,
        return: current.return,
        metadata: current.metadata,
      },
    );
    expect(result.content[0].text).toContain(
      'Data assembly updated successfully',
    );
  });

  it.each([
    ['dataType', []],
    ['variant', 'legacy-variant'],
    ['sys', { id: 'test-data-assembly-id', version: 1 }],
  ])('rejects the obsolete %s argument', (field, value) => {
    expect(
      UpdateDataAssemblyToolParams.safeParse({
        ...mockArgs,
        version: 1,
        [field]: value,
      }).success,
    ).toBe(false);
  });

  it('rejects a stale version', async () => {
    mockDataAssemblyGet.mockResolvedValue(mockDataAssembly); // sys.version === 1

    const tool = updateDataAssemblyTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 999 });

    expect(mockDataAssemblyUpdate).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = updateDataAssemblyTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool({ ...mockArgs, version: 1 });
    expect(mockDataAssemblyGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockDataAssemblyGet.mockRejectedValue(new Error('boom'));
    const tool = updateDataAssemblyTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });
    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error updating data assembly: boom' }],
    });
  });
});
