import { describe, it, expect } from 'vitest';
import {
  mockArgs,
  testOrg,
  mockOrgGet,
  mockCreateClient,
} from './mockClient.js';

import { getOrgTool } from './getOrg.js';
import { formatResponse } from '../../utils/formatters.js';
import { getDefaultClientConfig } from '../../config/contentful.js';

describe('getOrg', () => {
  it('should get an organization successfully', async () => {
    mockOrgGet.mockResolvedValue(testOrg);

    const result = await getOrgTool(mockArgs);
    const clientConfig = getDefaultClientConfig();
    delete clientConfig.space;
    expect(mockCreateClient).toHaveBeenCalledWith(clientConfig, {
      type: 'plain',
    });
    expect(mockOrgGet).toHaveBeenCalledWith({
      organizationId: mockArgs.organizationId,
    });

    const expectedResponse = formatResponse(
      'Organization retrieved successfully',
      {
        organization: testOrg,
      },
    );
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });
  });

  it('should handle errors when organization retrieval fails', async () => {
    const error = new Error('Retrieval failed');
    mockOrgGet.mockRejectedValue(error);

    const result = await getOrgTool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving organization: Retrieval failed',
        },
      ],
    });
  });
});
