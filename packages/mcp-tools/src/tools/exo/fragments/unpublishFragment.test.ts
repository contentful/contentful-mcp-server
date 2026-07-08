import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockFragmentGet,
  mockFragmentUnpublish,
  mockFragment,
  mockArgs,
} from './mockClient.js';
import { unpublishFragmentTool } from './unpublishFragment.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('unpublishFragment', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads the current version then unpublishes with it', async () => {
    mockFragmentGet.mockResolvedValue(mockFragment);
    mockFragmentUnpublish.mockResolvedValue(mockFragment);

    const tool = unpublishFragmentTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });

    expect(mockFragmentGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      fragmentId: mockArgs.fragmentId,
    });
    expect(mockFragmentUnpublish).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      fragmentId: mockArgs.fragmentId,
      version: mockFragment.sys.version,
    });
    expect(result.content[0].text).toContain('Fragment unpublished successfully');
  });

  it('rejects a stale version', async () => {
    mockFragmentGet.mockResolvedValue(mockFragment); // sys.version === 1

    const tool = unpublishFragmentTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 999 });

    expect(mockFragmentUnpublish).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = unpublishFragmentTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool({ ...mockArgs, version: 1 });
    expect(mockFragmentGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockFragmentGet.mockRejectedValue(new Error('boom'));
    const tool = unpublishFragmentTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });
    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error unpublishing fragment: boom' }],
    });
  });
});
