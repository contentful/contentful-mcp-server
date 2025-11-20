import { describe, it, expect } from 'vitest';
import {
  mockArgs,
  testSpace,
  mockSpaceGet,
  mockCreateClient,
} from './mockClient.js';

import { getSpaceTool } from './getSpace.js';
import { formatResponse } from '../../utils/formatters.js';
import { createClientConfig } from '../../utils/tools.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('getSpace', () => {
  const mockConfig = createMockConfig();
  it('should get a space successfully', async () => {
    mockSpaceGet.mockResolvedValue(testSpace);

    const tool = getSpaceTool(mockConfig);
    const result = await tool(mockArgs);
    const clientConfig = createClientConfig(mockConfig);
    expect(mockCreateClient).toHaveBeenCalledWith(clientConfig, {
      type: 'plain',
    });
    expect(mockSpaceGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
    });

    const expectedResponse = formatResponse('Space retrieved successfully', {
      space: testSpace,
    });
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });
  });

  it('should handle errors when space retrieval fails', async () => {
    const error = new Error('Retrieval failed');
    mockSpaceGet.mockRejectedValue(error);

    const tool = getSpaceTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving space: Retrieval failed',
        },
      ],
    });
  });
});
