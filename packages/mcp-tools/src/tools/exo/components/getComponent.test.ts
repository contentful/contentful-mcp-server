import { describe, it, expect } from 'vitest';
import { mockComponentGet, mockComponent, mockArgs } from './mockClient.js';
import { getComponentTool } from './getComponent.js';
import { formatResponse } from '../../../utils/formatters.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('getComponent', () => {
  const mockConfig = createMockConfig();

  it('retrieves a component successfully', async () => {
    mockComponentGet.mockResolvedValue(mockComponent);

    const tool = getComponentTool(mockConfig);
    const result = await tool(mockArgs);

    const expectedResponse = formatResponse(
      'Component retrieved successfully',
      { component: mockComponent },
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
    expect(mockComponentGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentId: mockArgs.componentId,
    });
  });

  it('handles errors when the component is not found', async () => {
    mockComponentGet.mockRejectedValue(new Error('Component not found'));

    const tool = getComponentTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving component: Component not found',
        },
      ],
    });
  });
});
