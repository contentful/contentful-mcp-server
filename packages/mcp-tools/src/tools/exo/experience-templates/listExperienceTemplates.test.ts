import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockExperienceTemplateGetMany,
  mockExperienceTemplatesResponse,
  mockArgs,
} from './mockClient.js';
import { listExperienceTemplatesTool } from './listExperienceTemplates.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('listExperienceTemplates', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('lists experience templates with default limit', async () => {
    mockExperienceTemplateGetMany.mockResolvedValue(
      mockExperienceTemplatesResponse,
    );

    const tool = listExperienceTemplatesTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockExperienceTemplateGetMany).toHaveBeenCalledWith(
      expect.objectContaining({
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
      }),
    );
    expect(result.content[0].text).toContain(
      'ExperienceTemplates retrieved successfully',
    );
  });

  it('passes pageNext cursor when provided', async () => {
    mockExperienceTemplateGetMany.mockResolvedValue(
      mockExperienceTemplatesResponse,
    );

    const tool = listExperienceTemplatesTool(mockConfig);
    await tool({ ...mockArgs, pageNext: 'some-cursor' });

    expect(mockExperienceTemplateGetMany).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ pageNext: 'some-cursor' }),
      }),
    );
  });

  it('handles errors', async () => {
    mockExperienceTemplateGetMany.mockRejectedValue(new Error('boom'));

    const tool = listExperienceTemplatesTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error listing experience templates: boom' },
      ],
    });
  });
});
