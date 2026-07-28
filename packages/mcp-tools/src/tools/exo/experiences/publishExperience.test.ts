import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockExperienceGet,
  mockExperiencePublish,
  mockExperience,
  mockArgs,
} from './mockClient.js';
import { publishExperienceTool } from './publishExperience.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('publishExperience', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads the current version then publishes with it', async () => {
    mockExperienceGet.mockResolvedValue(mockExperience);
    mockExperiencePublish.mockResolvedValue(mockExperience);

    const tool = publishExperienceTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });

    expect(mockExperienceGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceId: mockArgs.experienceId,
    });
    expect(mockExperiencePublish).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceId: mockArgs.experienceId,
      version: mockExperience.sys.version,
    });
    expect(result.content[0].text).toContain('Experience published successfully');
  });

  it('rejects a stale version', async () => {
    mockExperienceGet.mockResolvedValue(mockExperience); // sys.version === 1

    const tool = publishExperienceTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 999 });

    expect(mockExperiencePublish).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = publishExperienceTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool({ ...mockArgs, version: 1 });
    expect(mockExperienceGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockExperienceGet.mockRejectedValue(new Error('boom'));
    const tool = publishExperienceTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });
    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error publishing experience: boom' }],
    });
  });
});
