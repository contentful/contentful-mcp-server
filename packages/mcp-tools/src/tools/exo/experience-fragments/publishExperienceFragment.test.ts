import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockExperienceFragmentGet,
  mockExperienceFragmentPublish,
  mockExperienceFragment,
  mockArgs,
} from './mockClient.js';
import { publishExperienceFragmentTool } from './publishExperienceFragment.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('publishExperienceFragment', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads the current version then publishes with it', async () => {
    mockExperienceFragmentGet.mockResolvedValue(mockExperienceFragment);
    mockExperienceFragmentPublish.mockResolvedValue(mockExperienceFragment);

    const tool = publishExperienceFragmentTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });

    expect(mockExperienceFragmentGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceFragmentId: mockArgs.experienceFragmentId,
    });
    expect(mockExperienceFragmentPublish).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceFragmentId: mockArgs.experienceFragmentId,
      version: mockExperienceFragment.sys.version,
    });
    expect(result.content[0].text).toContain(
      'Experience fragment published successfully',
    );
  });

  it('rejects a stale version', async () => {
    mockExperienceFragmentGet.mockResolvedValue(mockExperienceFragment); // sys.version === 1

    const tool = publishExperienceFragmentTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 999 });

    expect(mockExperienceFragmentPublish).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = publishExperienceFragmentTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool({ ...mockArgs, version: 1 });
    expect(mockExperienceFragmentGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockExperienceFragmentGet.mockRejectedValue(new Error('boom'));
    const tool = publishExperienceFragmentTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });
    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error publishing experience fragment: boom' },
      ],
    });
  });
});
