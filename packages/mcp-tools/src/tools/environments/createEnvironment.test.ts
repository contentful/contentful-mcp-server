import { describe, it, expect } from 'vitest';
import {
  mockArgs,
  testEnvironment,
  mockEnvironmentCreateWithId,
} from './mockClient.js';

import { createEnvironmentTool } from './createEnvironment.js';
import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('createEnvironment', () => {
  const mockConfig = createMockConfig();
  it('should create an environment successfully', async () => {
    const testArgs = {
      ...mockArgs,
      environmentId: 'new-test-env',
      name: 'New Test Environment',
    };
    mockEnvironmentCreateWithId.mockResolvedValue(testEnvironment);

    const tool = createEnvironmentTool(mockConfig);
    const result = await tool(testArgs);
    expect(createToolClient).toHaveBeenCalledWith(mockConfig, testArgs);
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

    const tool = createEnvironmentTool(mockConfig);
    const result = await tool(testArgs);

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
