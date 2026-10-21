import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ctfl from 'contentful-management';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';
import {
  createDataAssemblyTool,
  CreateDataAssemblyToolParams,
} from './createDataAssembly.js';
import { updateDataAssemblyTool } from './updateDataAssembly.js';

type HttpAdapter = Extract<
  ctfl.RestAdapterParams['adapter'],
  (request: never) => unknown
>;

const { mockHttp } = vi.hoisted(() => ({ mockHttp: vi.fn() }));

// Exercise the installed SDK's serialization and headers without network calls.
vi.mock('contentful-management', async (importOriginal) => {
  const sdk = await importOriginal<typeof ctfl>();
  return {
    ...sdk,
    createClient: (options: ctfl.RestAdapterParams) =>
      sdk.createClient({
        ...options,
        adapter: async (request: Parameters<HttpAdapter>[0]) => ({
          data: await mockHttp({
            method: request.method,
            url: request.url,
            headers: request.headers.toJSON(),
            data: request.data ? JSON.parse(request.data) : undefined,
          }),
          status: 200,
          statusText: 'OK',
          headers: {},
          config: request,
        }),
      }),
  };
});

describe('DataAssembly SDK transport', () => {
  const config = createMockConfig({ mcpSource: 'remote' });
  const scope = { spaceId: 'caller-space', environmentId: 'caller-env' };
  const path = '/spaces/caller-space/environments/caller-env/data_assemblies';
  const parameters = [
    { id: 'title', type: 'String', required: false, fallbackValue: '' },
  ];
  const current = {
    sys: { id: 'assembly', type: 'DataAssembly', version: 7, dataType: [] },
    name: 'Assembly',
    description: 'Description',
    parameters,
    resolvers: {},
    return: {},
    metadata: { tags: [] },
  };
  const identifyingHeaders = {
    'X-Contentful-User-Agent-Tool': 'contentful-mcp-exo/remote-0.0.0',
    'User-Agent': 'contentful-mcp-exo/remote-0.0.0',
  };

  beforeEach(() => mockHttp.mockReset());

  it('posts canonical arrays to the caller scope with ExO identifying headers', async () => {
    mockHttp.mockResolvedValue(current);
    const args = CreateDataAssemblyToolParams.parse({
      ...scope,
      ...current,
      dataType: [],
    });

    const result = await createDataAssemblyTool(config)(args);

    expect(result.isError).not.toBe(true);
    expect(mockHttp).toHaveBeenCalledExactlyOnceWith({
      method: 'post',
      url: path,
      headers: expect.objectContaining(identifyingHeaders),
      data: { ...current, sys: { type: 'DataAssembly', dataType: [] } },
    });
  });

  it('preserves fetched arrays and the version header on a partial update', async () => {
    mockHttp.mockResolvedValueOnce(current).mockResolvedValueOnce(current);

    const result = await updateDataAssemblyTool(config)({
      ...scope,
      dataAssemblyId: 'assembly',
      version: 7,
      name: 'Renamed',
    });

    expect(result.isError).not.toBe(true);
    expect(mockHttp).toHaveBeenNthCalledWith(1, {
      method: 'get',
      url: `${path}/assembly`,
      headers: expect.objectContaining(identifyingHeaders),
      data: undefined,
    });
    expect(mockHttp).toHaveBeenNthCalledWith(2, {
      method: 'put',
      url: `${path}/assembly`,
      headers: expect.objectContaining({
        ...identifyingHeaders,
        'X-Contentful-Version': '7',
      }),
      data: { ...current, name: 'Renamed' },
    });
  });

  it('returns a PUT failure rather than reporting success', async () => {
    mockHttp
      .mockResolvedValueOnce(current)
      .mockRejectedValueOnce(new Error('write failed'));

    const result = await updateDataAssemblyTool(config)({
      ...scope,
      dataAssemblyId: 'assembly',
      version: 7,
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error updating data assembly');
  });
});
