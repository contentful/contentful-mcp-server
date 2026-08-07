import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockExperienceTemplateCreate,
  mockExperienceTemplate,
  mockArgs,
} from './mockClient.js';
import { createExperienceTemplateTool } from './createExperienceTemplate.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

const createArgs = {
  ...mockArgs,
  name: 'Test Experience Template',
  description: 'A test experience template',
  viewports: [],
  contentProperties: [],
  designProperties: [],
};

describe('createExperienceTemplate', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('creates an experience template', async () => {
    mockExperienceTemplateCreate.mockResolvedValue(mockExperienceTemplate);

    const tool = createExperienceTemplateTool(mockConfig);
    const result = await tool(createArgs);

    expect(mockExperienceTemplateCreate).toHaveBeenCalledWith(
      { spaceId: mockArgs.spaceId, environmentId: mockArgs.environmentId },
      expect.objectContaining({ name: createArgs.name }),
    );
    expect(result.content[0].text).toContain(
      'Experience template created successfully',
    );
  });

  it('rejects writes to a protected environment', async () => {
    const tool = createExperienceTemplateTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool(createArgs);
    expect(mockExperienceTemplateCreate).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });
});
