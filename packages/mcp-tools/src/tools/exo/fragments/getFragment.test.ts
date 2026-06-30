import { describe, it, expect } from 'vitest';
import { mockFragmentGet, mockFragment, mockArgs } from './mockClient.js';
import { getFragmentTool } from './getFragment.js';
import { formatResponse } from '../../../utils/formatters.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('getFragment', () => {
  const mockConfig = createMockConfig();

  it('retrieves a fragment successfully', async () => {
    mockFragmentGet.mockResolvedValue(mockFragment);

    const tool = getFragmentTool(mockConfig);
    const result = await tool(mockArgs);

    const expectedResponse = formatResponse('Fragment retrieved successfully', {
      fragment: mockFragment,
    });
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
    expect(mockFragmentGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      fragmentId: mockArgs.fragmentId,
    });
  });

  it('handles errors when the fragment is not found', async () => {
    mockFragmentGet.mockRejectedValue(new Error('Fragment not found'));

    const tool = getFragmentTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving fragment: Fragment not found',
        },
      ],
    });
  });
});
