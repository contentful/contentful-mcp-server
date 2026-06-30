import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockExperienceGet, mockExperience, mockArgs } from './mockClient.js';
import { getExperienceTool } from './getExperience.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('getExperience', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('retrieves an experience by ID', async () => {
    mockExperienceGet.mockResolvedValue(mockExperience);

    const tool = getExperienceTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockExperienceGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceId: mockArgs.experienceId,
    });
    expect(result.content[0].text).toContain('Experience retrieved successfully');
  });

  it('handles errors', async () => {
    mockExperienceGet.mockRejectedValue(new Error('not found'));

    const tool = getExperienceTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error retrieving experience: not found' }],
    });
  });
});
