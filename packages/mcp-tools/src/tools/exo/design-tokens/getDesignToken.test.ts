import { describe, it, expect } from 'vitest';
import { mockDesignTokenGet, mockDesignToken, mockArgs } from './mockClient.js';
import { getDesignTokenTool } from './getDesignToken.js';
import { formatResponse } from '../../../utils/formatters.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('getDesignToken', () => {
  const mockConfig = createMockConfig();

  it('retrieves a design token successfully', async () => {
    mockDesignTokenGet.mockResolvedValue(mockDesignToken);

    const tool = getDesignTokenTool(mockConfig);
    const result = await tool(mockArgs);

    const expectedResponse = formatResponse(
      'Design token retrieved successfully',
      { designToken: mockDesignToken },
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
    expect(mockDesignTokenGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      designTokenId: mockArgs.designTokenId,
    });
  });

  it('handles errors when the design token is not found', async () => {
    mockDesignTokenGet.mockRejectedValue(new Error('Design token not found'));

    const tool = getDesignTokenTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving design token: Design token not found',
        },
      ],
    });
  });
});
