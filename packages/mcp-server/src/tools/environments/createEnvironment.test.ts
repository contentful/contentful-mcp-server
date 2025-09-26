import { describe, it, expect } from 'vitest';
import {
  mockArgs,
  testEnvironment,
  mockEnvironmentCreateWithId,
} from './mockClient.js';

import { createEnvironmentTool } from './createEnvironment.js';
import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';

describe('createEnvironment', () => {
  it('should create an environment successfully', async () => {
    const testArgs = {
      ...mockArgs,
      environmentId: 'new-test-env',
      name: 'New Test Environment',
    };
    mockEnvironmentCreateWithId.mockResolvedValue(testEnvironment);

    const result = await createEnvironmentTool(testArgs);
    expect(createToolClient).toHaveBeenCalledWith(testArgs);
    expect(mockEnvironmentCreateWithId).toHaveBeenCalledWith(
      {
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
      },
      {
        name: testArgs.name,
      },
    );

    const expectedResponse = formatResponse(
      'Environment created successfully',
      {
        environment: testEnvironment,
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

  it('should handle errors when environment creation fails', async () => {
    const testArgs = {
      ...mockArgs,
      environmentId: 'invalid-env',
      name: 'Invalid Environment',
    };

    const error = new Error('Validation error');
    mockEnvironmentCreateWithId.mockRejectedValue(error);

    const result = await createEnvironmentTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error creating environment: Validation error',
        },
      ],
    });
  });
});
