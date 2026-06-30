import { describe, it, expect } from 'vitest';
import { mockDataAssemblyGet, mockDataAssembly, mockArgs } from './mockClient.js';
import { getDataAssemblyTool } from './getDataAssembly.js';
import { formatResponse } from '../../../utils/formatters.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('getDataAssembly', () => {
  const mockConfig = createMockConfig();

  it('retrieves a data assembly successfully', async () => {
    mockDataAssemblyGet.mockResolvedValue(mockDataAssembly);

    const tool = getDataAssemblyTool(mockConfig);
    const result = await tool(mockArgs);

    const expectedResponse = formatResponse('Data assembly retrieved successfully', {
      dataAssembly: mockDataAssembly,
    });
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
    expect(mockDataAssemblyGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      dataAssemblyId: mockArgs.dataAssemblyId,
    });
  });

  it('handles errors when the data assembly is not found', async () => {
    mockDataAssemblyGet.mockRejectedValue(new Error('Data assembly not found'));

    const tool = getDataAssemblyTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving data assembly: Data assembly not found',
        },
      ],
    });
  });
});
