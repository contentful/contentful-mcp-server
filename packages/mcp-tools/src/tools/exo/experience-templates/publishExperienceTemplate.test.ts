import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockExperienceTemplateGet,
  mockExperienceTemplatePublish,
  mockExperienceTemplate,
  mockArgs,
} from './mockClient.js';
import { publishExperienceTemplateTool } from './publishExperienceTemplate.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('publishExperienceTemplate', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads the current version then publishes with it', async () => {
    mockExperienceTemplateGet.mockResolvedValue(mockExperienceTemplate);
    mockExperienceTemplatePublish.mockResolvedValue(mockExperienceTemplate);

    const tool = publishExperienceTemplateTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });

    expect(mockExperienceTemplateGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceTemplateId: mockArgs.experienceTemplateId,
    });
    expect(mockExperienceTemplatePublish).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceTemplateId: mockArgs.experienceTemplateId,
      version: mockExperienceTemplate.sys.version,
    });
    expect(result.content[0].text).toContain(
      'Experience template published successfully',
    );
  });

  it('rejects a stale version', async () => {
    mockExperienceTemplateGet.mockResolvedValue(mockExperienceTemplate); // sys.version === 1

    const tool = publishExperienceTemplateTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 999 });

    expect(mockExperienceTemplatePublish).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = publishExperienceTemplateTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool({ ...mockArgs, version: 1 });
    expect(mockExperienceTemplateGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockExperienceTemplateGet.mockRejectedValue(new Error('boom'));
    const tool = publishExperienceTemplateTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });
    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error publishing experience template: boom' },
      ],
    });
  });
});
