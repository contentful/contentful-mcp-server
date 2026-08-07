import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockExperienceFragmentGet,
  mockExperienceFragmentDelete,
  mockExperienceFragment,
  mockArgs,
} from './mockClient.js';
import { deleteExperienceFragmentTool } from './deleteExperienceFragment.js';
import { buildConfirmToken } from '../../../utils/confirmation.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('deleteExperienceFragment', () => {
  const mockConfig = createMockConfig();
  const validToken = buildConfirmToken(
    'experienceFragment',
    mockArgs.experienceFragmentId,
    mockExperienceFragment.sys.version,
  );

  beforeEach(() => vi.clearAllMocks());

  it('returns a confirmation preview when confirm is missing', async () => {
    mockExperienceFragmentGet.mockResolvedValue(mockExperienceFragment);

    const tool = deleteExperienceFragmentTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockExperienceFragmentDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
    expect(result.content[0].text).toContain(validToken);
  });

  it('returns a preview when the confirmToken is wrong', async () => {
    mockExperienceFragmentGet.mockResolvedValue(mockExperienceFragment);

    const tool = deleteExperienceFragmentTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: 'wrong',
    });

    expect(mockExperienceFragmentDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('deletes when confirm is true and the token matches', async () => {
    mockExperienceFragmentGet.mockResolvedValue(mockExperienceFragment);
    mockExperienceFragmentDelete.mockResolvedValue(undefined);

    const tool = deleteExperienceFragmentTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: validToken,
    });

    expect(mockExperienceFragmentDelete).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceFragmentId: mockArgs.experienceFragmentId,
    });
    expect(result.content[0].text).toContain(
      'Experience fragment deleted successfully',
    );
  });

  it('rejects deletes in a protected environment', async () => {
    const tool = deleteExperienceFragmentTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool(mockArgs);
    expect(mockExperienceFragmentGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });
});
