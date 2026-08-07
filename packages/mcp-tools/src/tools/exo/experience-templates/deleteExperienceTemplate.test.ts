import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockExperienceTemplateGet,
  mockExperienceTemplateDelete,
  mockExperienceTemplate,
  mockArgs,
} from './mockClient.js';
import { deleteExperienceTemplateTool } from './deleteExperienceTemplate.js';
import { buildConfirmToken } from '../../../utils/confirmation.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('deleteExperienceTemplate', () => {
  const mockConfig = createMockConfig();
  const validToken = buildConfirmToken(
    'experienceTemplate',
    mockArgs.experienceTemplateId,
    mockExperienceTemplate.sys.version,
  );

  beforeEach(() => vi.clearAllMocks());

  it('returns a confirmation preview when confirm is missing', async () => {
    mockExperienceTemplateGet.mockResolvedValue(mockExperienceTemplate);

    const tool = deleteExperienceTemplateTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockExperienceTemplateDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
    expect(result.content[0].text).toContain(validToken);
  });

  it('returns a preview when the confirmToken is wrong', async () => {
    mockExperienceTemplateGet.mockResolvedValue(mockExperienceTemplate);

    const tool = deleteExperienceTemplateTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: 'wrong',
    });

    expect(mockExperienceTemplateDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('deletes when confirm is true and the token matches', async () => {
    mockExperienceTemplateGet.mockResolvedValue(mockExperienceTemplate);
    mockExperienceTemplateDelete.mockResolvedValue(undefined);

    const tool = deleteExperienceTemplateTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: validToken,
    });

    expect(mockExperienceTemplateDelete).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceTemplateId: mockArgs.experienceTemplateId,
    });
    expect(result.content[0].text).toContain(
      'Experience template deleted successfully',
    );
  });

  it('rejects deletes in a protected environment', async () => {
    const tool = deleteExperienceTemplateTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool(mockArgs);
    expect(mockExperienceTemplateGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });
});
