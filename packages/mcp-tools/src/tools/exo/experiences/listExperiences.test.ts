import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockExperienceGetMany,
  mockExperiencesResponse,
  mockArgs,
} from './mockClient.js';
import { listExperiencesTool } from './listExperiences.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('listExperiences', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('lists experiences with default limit', async () => {
    mockExperienceGetMany.mockResolvedValue(mockExperiencesResponse);

    const tool = listExperiencesTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockExperienceGetMany).toHaveBeenCalledWith(
      expect.objectContaining({
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
      }),
    );
    expect(result.content[0].text).toContain('Experiences retrieved successfully');
  });

  it('passes pageNext cursor when provided', async () => {
    mockExperienceGetMany.mockResolvedValue(mockExperiencesResponse);

    const tool = listExperiencesTool(mockConfig);
    await tool({ ...mockArgs, pageNext: 'some-cursor' });

    expect(mockExperienceGetMany).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ pageNext: 'some-cursor' }),
      }),
    );
  });

  it('handles errors', async () => {
    mockExperienceGetMany.mockRejectedValue(new Error('boom'));

    const tool = listExperiencesTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error listing experiences: boom' }],
    });
  });
});
