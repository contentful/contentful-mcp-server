import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockExperienceTemplateGet,
  mockExperienceTemplate,
  mockArgs,
} from './mockClient.js';
import { getExperienceTemplateTool } from './getExperienceTemplate.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('getExperienceTemplate', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('retrieves an experience template by ID', async () => {
    mockExperienceTemplateGet.mockResolvedValue(mockExperienceTemplate);

    const tool = getExperienceTemplateTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockExperienceTemplateGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceTemplateId: mockArgs.experienceTemplateId,
    });
    expect(result.content[0].text).toContain(
      'Experience template retrieved successfully',
    );
  });

  it('handles errors', async () => {
    mockExperienceTemplateGet.mockRejectedValue(new Error('not found'));

    const tool = getExperienceTemplateTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving experience template: not found',
        },
      ],
    });
  });
});
