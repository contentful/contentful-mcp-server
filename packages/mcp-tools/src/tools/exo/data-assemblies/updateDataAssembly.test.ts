import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockDataAssemblyGet,
  mockDataAssemblyUpdate,
  mockDataAssembly,
  mockArgs,
  mockParameters,
} from './mockClient.js';
import {
  updateDataAssemblyTool,
  UpdateDataAssemblyToolParams,
} from './updateDataAssembly.js';
import { createDataAssemblyTools } from './register.js';
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

    const registered = createDataAssemblyTools(mockConfig).updateDataAssembly;
    const args = registered.inputParams.parse({
      ...mockArgs,
      version: 1,
      name: 'Updated Data Assembly',
    });
    const result = await registered.tool(args);

    expect(mockDataAssemblyGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      dataAssemblyId: mockArgs.dataAssemblyId,
    });
    expect(mockDataAssemblyUpdate).toHaveBeenCalledWith(
      `/spaces/${mockArgs.spaceId}/environments/${mockArgs.environmentId}/data_assemblies/${mockArgs.dataAssemblyId}`,
      {
        name: 'Updated Data Assembly',
        description: current.description,
        parameters: current.parameters,
        resolvers: current.resolvers,
        return: current.return,
        metadata: current.metadata,
      },
      { headers: { 'X-Contentful-Version': 1 } },
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
    const registered = createDataAssemblyTools(mockConfig).updateDataAssembly;
    expect(
      registered.inputParams.safeParse({
        ...mockArgs,
        version: 1,
        [field]: value,
      }).success,
    ).toBe(false);
  });

  it('forwards a replacement array through the registered input schema', async () => {
    mockDataAssemblyGet.mockResolvedValue(mockDataAssembly);
    mockDataAssemblyUpdate.mockResolvedValue(mockDataAssembly);
    const parameters = [...mockParameters].reverse();
    const registered = createDataAssemblyTools(mockConfig).updateDataAssembly;
    const args = registered.inputParams.parse({
      ...mockArgs,
      version: 1,
      parameters,
    });

    const result = await registered.tool(args);

    expect(result.isError).not.toBe(true);
    expect(mockDataAssemblyUpdate).toHaveBeenCalledWith(
      `/spaces/${mockArgs.spaceId}/environments/${mockArgs.environmentId}/data_assemblies/${mockArgs.dataAssemblyId}`,
      expect.objectContaining({ parameters }),
      { headers: { 'X-Contentful-Version': 1 } },
    );
  });

  it('accepts an empty replacement array instead of retaining current parameters', async () => {
    mockDataAssemblyGet.mockResolvedValue(mockDataAssembly);
    mockDataAssemblyUpdate.mockResolvedValue(mockDataAssembly);
    const registered = createDataAssemblyTools(mockConfig).updateDataAssembly;
    const args = registered.inputParams.parse({
      ...mockArgs,
      version: 1,
      parameters: [],
    });

    await registered.tool(args);

    expect(mockDataAssemblyUpdate).toHaveBeenCalledWith(
      `/spaces/${mockArgs.spaceId}/environments/${mockArgs.environmentId}/data_assemblies/${mockArgs.dataAssemblyId}`,
      expect.objectContaining({ parameters: [] }),
      { headers: { 'X-Contentful-Version': 1 } },
    );
  });

  it('rejects legacy record input through the registered schema', () => {
    const registered = createDataAssemblyTools(mockConfig).updateDataAssembly;
    expect(() =>
      registered.inputParams.parse({
        ...mockArgs,
        version: 1,
        parameters: { title: { type: 'String', required: true } },
      }),
    ).toThrow();
    expect(mockDataAssemblyUpdate).not.toHaveBeenCalled();
  });

  it('rejects a noncanonical current response rather than resubmitting a record', async () => {
    mockDataAssemblyGet.mockResolvedValue({
      ...mockDataAssembly,
      parameters: {},
    });
    const tool = updateDataAssemblyTool(mockConfig);

    const result = await tool({ ...mockArgs, version: 1, name: 'New name' });

    expect(result.isError).toBe(true);
    expect(mockDataAssemblyUpdate).not.toHaveBeenCalled();
  });

  it.each(
    [
      [{ id: 'title', type: 'String', futureMetadata: {} }],
      [{ id: '', type: 'String', required: false, futureMetadata: {} }],
      [{ id: 'title', type: 'String', required: 'false', futureMetadata: {} }],
      [
        {
          id: 'limit',
          type: 'Number',
          required: false,
          validation: { min: 'zero', unit: 'px' },
        },
      ],
      [{ id: 'title', type: 'NewType', required: false, futureMetadata: {} }],
      [
        { id: 'title', type: 'String', required: false, futureMetadata: {} },
        { id: 'title', type: 'Number', required: false },
      ],
      [
        {
          id: 'options',
          type: 'Record',
          required: false,
          futureMetadata: {},
          fields: [
            { id: 'value', type: 'String', futureMetadata: {} },
            { id: 'value', type: 'Number' },
          ],
        },
      ],
      [
        {
          id: 'options',
          type: 'Record',
          required: false,
          fields: [{ id: '', type: 'String', futureMetadata: {} }],
        },
      ],
    ].map((parameters) => ({ parameters })),
  )(
    'rejects invalid fetched declarations even with unknown fields: %j',
    async ({ parameters }) => {
      mockDataAssemblyGet.mockResolvedValue({
        ...mockDataAssembly,
        parameters,
      });

      const result = await updateDataAssemblyTool(mockConfig)({
        ...mockArgs,
        version: 1,
        name: 'New name',
      });

      expect(result.isError).toBe(true);
      expect(mockDataAssemblyUpdate).not.toHaveBeenCalled();
    },
  );

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
