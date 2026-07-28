import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockExperienceGet,
  mockExperienceUpsert,
  mockExperience,
  mockArgs,
} from './mockClient.js';
import { upsertExperienceTool } from './upsertExperience.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('upsertExperience', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads the current experience before updating (read-before-write)', async () => {
    mockExperienceGet.mockResolvedValue(mockExperience);
    mockExperienceUpsert.mockResolvedValue({ ...mockExperience, name: 'Renamed' });

    const tool = upsertExperienceTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1, name: 'Renamed' });

    expect(mockExperienceGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceId: mockArgs.experienceId,
    });
    const [params, body] = mockExperienceUpsert.mock.calls[0];
    expect(params).toEqual({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceId: mockArgs.experienceId,
    });
    expect(body.sys).toEqual({
      id: mockExperience.sys.id,
      type: 'Experience',
      version: mockExperience.sys.version,
    });
    expect(body.name).toBe('Renamed');
    expect(body.description).toBe(mockExperience.description);
    expect(result.content[0].text).toContain('Experience updated successfully');
  });

  it('preserves unspecified fields from the existing experience', async () => {
    mockExperienceGet.mockResolvedValue({
      ...mockExperience,
      designProperties: { color: { _: { type: 'ManualDesignValue', value: 'red' } } },
    });
    mockExperienceUpsert.mockResolvedValue(mockExperience);

    const tool = upsertExperienceTool(mockConfig);
    await tool({ ...mockArgs, version: 1, name: 'Renamed' });

    const [, body] = mockExperienceUpsert.mock.calls[0];
    expect(body.designProperties).toEqual({
      color: { _: { type: 'ManualDesignValue', value: 'red' } },
    });
  });

  it('rejects a stale version', async () => {
    mockExperienceGet.mockResolvedValue(mockExperience); // sys.version === 1

    const tool = upsertExperienceTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 999, name: 'New Name' });

    expect(mockExperienceUpsert).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = upsertExperienceTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool({ ...mockArgs, version: 1, name: 'New Name' });
    expect(mockExperienceGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockExperienceGet.mockRejectedValue(new Error('not found'));

    const tool = upsertExperienceTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1, name: 'Renamed' });

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error updating experience: not found' }],
    });
  });
});
