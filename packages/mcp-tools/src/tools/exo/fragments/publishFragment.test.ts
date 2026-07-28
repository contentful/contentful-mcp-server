import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockFragmentGet,
  mockFragmentPublish,
  mockFragment,
  mockArgs,
} from './mockClient.js';
import { publishFragmentTool } from './publishFragment.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('publishFragment', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads the current version then publishes with it', async () => {
    mockFragmentGet.mockResolvedValue(mockFragment);
    mockFragmentPublish.mockResolvedValue(mockFragment);

    const tool = publishFragmentTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });

    expect(mockFragmentGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      fragmentId: mockArgs.fragmentId,
    });
    expect(mockFragmentPublish).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      fragmentId: mockArgs.fragmentId,
      version: mockFragment.sys.version,
    });
    expect(result.content[0].text).toContain('Fragment published successfully');
  });

  it('rejects a stale version', async () => {
    mockFragmentGet.mockResolvedValue(mockFragment); // sys.version === 1

    const tool = publishFragmentTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 999 });

    expect(mockFragmentPublish).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = publishFragmentTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool({ ...mockArgs, version: 1 });
    expect(mockFragmentGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockFragmentGet.mockRejectedValue(new Error('boom'));
    const tool = publishFragmentTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });
    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error publishing fragment: boom' }],
    });
  });
});
