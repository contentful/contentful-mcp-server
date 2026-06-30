import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockExperienceGet,
  mockExperienceDelete,
  mockExperience,
  mockArgs,
} from './mockClient.js';
import { deleteExperienceTool } from './deleteExperience.js';
import { buildConfirmToken } from '../../../utils/confirmation.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('deleteExperience', () => {
  const mockConfig = createMockConfig();
  const validToken = buildConfirmToken(
    'experience',
    mockArgs.experienceId,
    mockExperience.sys.version,
  );

  beforeEach(() => vi.clearAllMocks());

  it('returns a confirmation preview when confirm is missing', async () => {
    mockExperienceGet.mockResolvedValue(mockExperience);

    const tool = deleteExperienceTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockExperienceDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
    expect(result.content[0].text).toContain(validToken);
  });

  it('returns a preview when the confirmToken is wrong', async () => {
    mockExperienceGet.mockResolvedValue(mockExperience);

    const tool = deleteExperienceTool(mockConfig);
    const result = await tool({ ...mockArgs, confirm: true, confirmToken: 'wrong' });

    expect(mockExperienceDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('deletes when confirm is true and the token matches', async () => {
    mockExperienceGet.mockResolvedValue(mockExperience);
    mockExperienceDelete.mockResolvedValue(undefined);

    const tool = deleteExperienceTool(mockConfig);
    const result = await tool({ ...mockArgs, confirm: true, confirmToken: validToken });

    expect(mockExperienceDelete).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceId: mockArgs.experienceId,
    });
    expect(result.content[0].text).toContain('Experience deleted successfully');
  });

  it('rejects deletes in a protected environment', async () => {
    const tool = deleteExperienceTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool(mockArgs);
    expect(mockExperienceGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });
});
