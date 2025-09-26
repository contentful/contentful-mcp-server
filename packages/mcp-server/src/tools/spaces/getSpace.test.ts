import { describe, it, expect } from 'vitest';
import {
  mockArgs,
  testSpace,
  mockSpaceGet,
  mockCreateClient,
} from './mockClient.js';

import { getSpaceTool } from './getSpace.js';
import { formatResponse } from '../../utils/formatters.js';
import { getDefaultClientConfig } from '../../config/contentful.js';

describe('getSpace', () => {
  it('should get a space successfully', async () => {
    mockSpaceGet.mockResolvedValue(testSpace);

    const result = await getSpaceTool(mockArgs);
    const clientConfig = getDefaultClientConfig();
    delete clientConfig.space;
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

    const result = await getSpaceTool(mockArgs);

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
