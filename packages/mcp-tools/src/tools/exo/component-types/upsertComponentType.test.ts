import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockComponentTypeGet,
  mockComponentTypeUpsert,
  mockComponentType,
  mockArgs,
} from './mockClient.js';
import { upsertComponentTypeTool } from './upsertComponentType.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('upsertComponentType', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => vi.clearAllMocks());

  it('reads the current component type before updating (read-before-write)', async () => {
    mockComponentTypeGet.mockResolvedValue(mockComponentType);
    mockComponentTypeUpsert.mockResolvedValue({
      ...mockComponentType,
      name: 'Renamed',
    });

    const tool = upsertComponentTypeTool(mockConfig);
    const result = await tool({ ...mockArgs, name: 'Renamed' });

    // get is called first to obtain current state + version
    expect(mockComponentTypeGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentTypeId: mockArgs.componentTypeId,
    });
    // upsert carries the current sys.version and the merged name
    const [params, body] = mockComponentTypeUpsert.mock.calls[0];
    expect(params).toEqual({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentTypeId: mockArgs.componentTypeId,
    });
    expect(body.sys).toEqual({
      id: mockComponentType.sys.id,
      type: 'ComponentType',
      version: mockComponentType.sys.version,
    });
    expect(body.name).toBe('Renamed');
    expect(body.description).toBe(mockComponentType.description);
    expect(result.content[0].text).toContain('Component type updated successfully');
  });

  it('preserves unspecified fields from the existing component type', async () => {
    mockComponentTypeGet.mockResolvedValue({
      ...mockComponentType,
      designProperties: [{ id: 'color', name: 'Color', type: 'String' }],
    });
    mockComponentTypeUpsert.mockResolvedValue(mockComponentType);

    const tool = upsertComponentTypeTool(mockConfig);
    await tool({ ...mockArgs, name: 'Renamed' });

    const [, body] = mockComponentTypeUpsert.mock.calls[0];
    expect(body.designProperties).toEqual([
      { id: 'color', name: 'Color', type: 'String' },
    ]);
  });

  it('rejects writes to a protected environment', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['test-environment'],
    });

    const tool = upsertComponentTypeTool(protectedConfig);
    const result = await tool({ ...mockArgs, name: 'Renamed' });

    expect(mockComponentTypeGet).not.toHaveBeenCalled();
    expect(mockComponentTypeUpsert).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockComponentTypeGet.mockRejectedValue(new Error('not found'));

    const tool = upsertComponentTypeTool(mockConfig);
    const result = await tool({ ...mockArgs, name: 'Renamed' });

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error updating component type: not found' }],
    });
  });
});
