import { describe, it, expect } from 'vitest';
import { mockArgs, mockEnvironmentDelete } from './mockClient.js';

import { deleteEnvironmentTool } from './deleteEnvironment.js';
import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('deleteEnvironment', () => {
  const mockConfig = createMockConfig();
  it('should delete an environment successfully', async () => {
    const testArgs = {
      ...mockArgs,
      environmentId: 'env-to-delete',
    };
    mockEnvironmentDelete.mockResolvedValue(undefined);

    const tool = deleteEnvironmentTool(mockConfig);
    const result = await tool(testArgs);
    expect(createToolClient).toHaveBeenCalledWith(mockConfig, testArgs);
    expect(mockEnvironmentDelete).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
    });

    const expectedResponse = formatResponse(
      'Environment deleted successfully',
      {
        environmentId: testArgs.environmentId,
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

  it('should handle errors when environment deletion fails', async () => {
    const testArgs = {
      ...mockArgs,
      environmentId: 'invalid-env',
    };

    const error = new Error('Deletion failed');
    mockEnvironmentDelete.mockRejectedValue(error);

    const tool = deleteEnvironmentTool(mockConfig);
    const result = await tool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error deleting environment: Deletion failed',
        },
      ],
    });
  });
});
