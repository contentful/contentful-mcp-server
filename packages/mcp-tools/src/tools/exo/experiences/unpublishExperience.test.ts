import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockExperienceGet,
  mockExperienceUnpublish,
  mockExperience,
  mockArgs,
} from './mockClient.js';
import { unpublishExperienceTool } from './unpublishExperience.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('unpublishExperience', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads the current version then unpublishes with it', async () => {
    mockExperienceGet.mockResolvedValue(mockExperience);
    mockExperienceUnpublish.mockResolvedValue(mockExperience);

    const tool = unpublishExperienceTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });

    expect(mockExperienceGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceId: mockArgs.experienceId,
    });
    expect(mockExperienceUnpublish).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceId: mockArgs.experienceId,
      version: mockExperience.sys.version,
    });
    expect(result.content[0].text).toContain('Experience unpublished successfully');
  });

  it('rejects a stale version', async () => {
    mockExperienceGet.mockResolvedValue(mockExperience); // sys.version === 1

    const tool = unpublishExperienceTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 999 });

    expect(mockExperienceUnpublish).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = unpublishExperienceTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool({ ...mockArgs, version: 1 });
    expect(mockExperienceGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockExperienceGet.mockRejectedValue(new Error('boom'));
    const tool = unpublishExperienceTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });
    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error unpublishing experience: boom' }],
    });
  });
});
