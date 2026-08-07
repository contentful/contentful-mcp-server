import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockExperienceFragmentGet,
  mockExperienceFragmentUnpublish,
  mockExperienceFragment,
  mockArgs,
} from './mockClient.js';
import { unpublishExperienceFragmentTool } from './unpublishExperienceFragment.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('unpublishExperienceFragment', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads the current version then unpublishes with it', async () => {
    mockExperienceFragmentGet.mockResolvedValue(mockExperienceFragment);
    mockExperienceFragmentUnpublish.mockResolvedValue(mockExperienceFragment);

    const tool = unpublishExperienceFragmentTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });

    expect(mockExperienceFragmentGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceFragmentId: mockArgs.experienceFragmentId,
    });
    expect(mockExperienceFragmentUnpublish).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceFragmentId: mockArgs.experienceFragmentId,
      version: mockExperienceFragment.sys.version,
    });
    expect(result.content[0].text).toContain(
      'Experience fragment unpublished successfully',
    );
  });

  it('rejects a stale version', async () => {
    mockExperienceFragmentGet.mockResolvedValue(mockExperienceFragment); // sys.version === 1

    const tool = unpublishExperienceFragmentTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 999 });

    expect(mockExperienceFragmentUnpublish).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = unpublishExperienceFragmentTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool({ ...mockArgs, version: 1 });
    expect(mockExperienceFragmentGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockExperienceFragmentGet.mockRejectedValue(new Error('boom'));
    const tool = unpublishExperienceFragmentTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });
    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error unpublishing experience fragment: boom' },
      ],
    });
  });
});
