import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockFragmentGet,
  mockFragmentUpsert,
  mockFragment,
  mockArgs,
} from './mockClient.js';
import { updateFragmentTool } from './updateFragment.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('updateFragment', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads before writing and merges fields', async () => {
    mockFragmentGet.mockResolvedValue(mockFragment);
    mockFragmentUpsert.mockResolvedValue({
      ...mockFragment,
      name: 'Updated Fragment',
      sys: { ...mockFragment.sys, version: 2 },
    });

    const tool = updateFragmentTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1, name: 'Updated Fragment' });

    expect(mockFragmentGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      fragmentId: mockArgs.fragmentId,
    });
    expect(mockFragmentUpsert).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
        fragmentId: mockArgs.fragmentId,
      },
      expect.objectContaining({
        name: 'Updated Fragment',
        description: mockFragment.description,
      }),
    );
    expect(result.content[0].text).toContain('Fragment updated successfully');
  });

  it('rejects a stale version', async () => {
    mockFragmentGet.mockResolvedValue(mockFragment); // sys.version === 1

    const tool = updateFragmentTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 999 });

    expect(mockFragmentUpsert).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = updateFragmentTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool({ ...mockArgs, version: 1 });
    expect(mockFragmentGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockFragmentGet.mockRejectedValue(new Error('boom'));
    const tool = updateFragmentTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });
    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error updating fragment: boom' }],
    });
  });
});
