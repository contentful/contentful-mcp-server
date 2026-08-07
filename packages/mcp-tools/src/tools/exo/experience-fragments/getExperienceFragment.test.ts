import { describe, it, expect } from 'vitest';
import {
  mockExperienceFragmentGet,
  mockExperienceFragment,
  mockArgs,
} from './mockClient.js';
import { getExperienceFragmentTool } from './getExperienceFragment.js';
import { formatResponse } from '../../../utils/formatters.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('getExperienceFragment', () => {
  const mockConfig = createMockConfig();

  it('retrieves an experience fragment successfully', async () => {
    mockExperienceFragmentGet.mockResolvedValue(mockExperienceFragment);

    const tool = getExperienceFragmentTool(mockConfig);
    const result = await tool(mockArgs);

    const expectedResponse = formatResponse(
      'Experience fragment retrieved successfully',
      {
        experienceFragment: mockExperienceFragment,
      },
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
    expect(mockExperienceFragmentGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceFragmentId: mockArgs.experienceFragmentId,
    });
  });

  it('handles errors when the experience fragment is not found', async () => {
    mockExperienceFragmentGet.mockRejectedValue(
      new Error('Experience fragment not found'),
    );

    const tool = getExperienceFragmentTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving experience fragment: Experience fragment not found',
        },
      ],
    });
  });
});
