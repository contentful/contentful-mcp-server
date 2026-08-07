import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockExperienceFragmentGet,
  mockExperienceFragmentUpsert,
  mockExperienceFragment,
  mockArgs,
} from './mockClient.js';
import { updateExperienceFragmentTool } from './updateExperienceFragment.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('updateExperienceFragment', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads before writing and merges fields', async () => {
    mockExperienceFragmentGet.mockResolvedValue(mockExperienceFragment);
    mockExperienceFragmentUpsert.mockResolvedValue({
      ...mockExperienceFragment,
      name: 'Updated Experience Fragment',
      sys: { ...mockExperienceFragment.sys, version: 2 },
    });

    const tool = updateExperienceFragmentTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      version: 1,
      name: 'Updated Experience Fragment',
    });

    expect(mockExperienceFragmentGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceFragmentId: mockArgs.experienceFragmentId,
    });
    expect(mockExperienceFragmentUpsert).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
        experienceFragmentId: mockArgs.experienceFragmentId,
      },
      expect.objectContaining({
        name: 'Updated Experience Fragment',
        description: mockExperienceFragment.description,
      }),
    );
    expect(result.content[0].text).toContain(
      'Experience fragment updated successfully',
    );
  });

  it('rejects a stale version', async () => {
    mockExperienceFragmentGet.mockResolvedValue(mockExperienceFragment); // sys.version === 1

    const tool = updateExperienceFragmentTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 999 });

    expect(mockExperienceFragmentUpsert).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = updateExperienceFragmentTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool({ ...mockArgs, version: 1 });
    expect(mockExperienceFragmentGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockExperienceFragmentGet.mockRejectedValue(new Error('boom'));
    const tool = updateExperienceFragmentTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });
    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error updating experience fragment: boom' },
      ],
    });
  });
});
