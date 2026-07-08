import { describe, it, expect } from 'vitest';
import { mockDataAssemblyGetPublished, mockDataAssembly, mockArgs } from './mockClient.js';
import { getPublishedDataAssemblyTool } from './getPublishedDataAssembly.js';
import { formatResponse } from '../../../utils/formatters.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('getPublishedDataAssembly', () => {
  const mockConfig = createMockConfig();

  it('retrieves a published data assembly successfully', async () => {
    mockDataAssemblyGetPublished.mockResolvedValue(mockDataAssembly);

    const tool = getPublishedDataAssemblyTool(mockConfig);
    const result = await tool(mockArgs);

    const expectedResponse = formatResponse('Published data assembly retrieved successfully', {
      dataAssembly: mockDataAssembly,
    });
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
    expect(mockDataAssemblyGetPublished).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      dataAssemblyId: mockArgs.dataAssemblyId,
    });
  });

  it('handles errors when the published data assembly is not found', async () => {
    mockDataAssemblyGetPublished.mockRejectedValue(new Error('Not found'));

    const tool = getPublishedDataAssemblyTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving published data assembly: Not found',
        },
      ],
    });
  });
});
