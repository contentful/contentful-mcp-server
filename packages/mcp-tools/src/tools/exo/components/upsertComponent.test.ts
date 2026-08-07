import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockComponentGet,
  mockComponentUpsert,
  mockComponent,
  mockArgs,
} from './mockClient.js';
import { upsertComponentTool } from './upsertComponent.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('upsertComponent', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => vi.clearAllMocks());

  it('reads the current component before updating (read-before-write)', async () => {
    mockComponentGet.mockResolvedValue(mockComponent);
    mockComponentUpsert.mockResolvedValue({
      ...mockComponent,
      name: 'Renamed',
    });

    const tool = upsertComponentTool(mockConfig);
    const result = await tool({ ...mockArgs, name: 'Renamed', version: 1 });

    // get is called first to obtain current state + version
    expect(mockComponentGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentId: mockArgs.componentId,
    });
    // upsert carries the current sys.version and the merged name
    const [params, body] = mockComponentUpsert.mock.calls[0];
    expect(params).toEqual({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentId: mockArgs.componentId,
    });
    expect(body.sys).toEqual({
      id: mockComponent.sys.id,
      type: 'Component',
      version: mockComponent.sys.version,
    });
    expect(body.name).toBe('Renamed');
    expect(body.description).toBe(mockComponent.description);
    expect(result.content[0].text).toContain('Component updated successfully');
  });

  it('preserves unspecified fields from the existing component', async () => {
    mockComponentGet.mockResolvedValue({
      ...mockComponent,
      designProperties: [{ id: 'color', name: 'Color', type: 'String' }],
    });
    mockComponentUpsert.mockResolvedValue(mockComponent);

    const tool = upsertComponentTool(mockConfig);
    await tool({ ...mockArgs, name: 'Renamed', version: 1 });

    const [, body] = mockComponentUpsert.mock.calls[0];
    expect(body.designProperties).toEqual([
      { id: 'color', name: 'Color', type: 'String' },
    ]);
  });

  it('preserves dataAssemblies from the existing component', async () => {
    const dataAssemblies = [
      { sys: { id: 'da-1', type: 'Link', linkType: 'DataAssembly' } },
    ];
    mockComponentGet.mockResolvedValue({
      ...mockComponent,
      dataAssemblies,
    });
    mockComponentUpsert.mockResolvedValue(mockComponent);

    const tool = upsertComponentTool(mockConfig);
    await tool({ ...mockArgs, name: 'Renamed', version: 1 });

    const [, body] = mockComponentUpsert.mock.calls[0];
    expect(body.dataAssemblies).toEqual(dataAssemblies);
  });

  it('rejects a stale version', async () => {
    mockComponentGet.mockResolvedValue(mockComponent); // sys.version === 1

    const tool = upsertComponentTool(mockConfig);
    const result = await tool({ ...mockArgs, name: 'Renamed', version: 999 });

    expect(mockComponentUpsert).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('rejects writes to a protected environment', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['test-environment'],
    });

    const tool = upsertComponentTool(protectedConfig);
    const result = await tool({ ...mockArgs, name: 'Renamed', version: 1 });

    expect(mockComponentGet).not.toHaveBeenCalled();
    expect(mockComponentUpsert).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockComponentGet.mockRejectedValue(new Error('not found'));

    const tool = upsertComponentTool(mockConfig);
    const result = await tool({ ...mockArgs, name: 'Renamed', version: 1 });

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error updating component: not found' }],
    });
  });
});
