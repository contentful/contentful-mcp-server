import { describe, it, expect } from 'vitest';
import { mockArgs, mockEnvironmentDelete } from './mockClient.js';

import { deleteEnvironmentTool } from './deleteEnvironment.js';
import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';

describe('deleteEnvironment', () => {
  it('should delete an environment successfully', async () => {
    const testArgs = {
      ...mockArgs,
      environmentId: 'env-to-delete',
    };
    mockEnvironmentDelete.mockResolvedValue(undefined);

    const result = await deleteEnvironmentTool(testArgs);
    expect(createToolClient).toHaveBeenCalledWith(testArgs);
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

    const result = await deleteEnvironmentTool(testArgs);

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
