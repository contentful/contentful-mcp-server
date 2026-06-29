import { describe, it, expect } from 'vitest';
import {
  mockComponentTypeGet,
  mockComponentType,
  mockArgs,
} from './mockClient.js';
import { getComponentTypeTool } from './getComponentType.js';
import { formatResponse } from '../../../utils/formatters.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('getComponentType', () => {
  const mockConfig = createMockConfig();

  it('retrieves a component type successfully', async () => {
    mockComponentTypeGet.mockResolvedValue(mockComponentType);

    const tool = getComponentTypeTool(mockConfig);
    const result = await tool(mockArgs);

    const expectedResponse = formatResponse(
      'Component type retrieved successfully',
      { componentType: mockComponentType },
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
    expect(mockComponentTypeGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentTypeId: mockArgs.componentTypeId,
    });
  });

  it('handles errors when the component type is not found', async () => {
    mockComponentTypeGet.mockRejectedValue(new Error('Component type not found'));

    const tool = getComponentTypeTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving component type: Component type not found',
        },
      ],
    });
  });
});
