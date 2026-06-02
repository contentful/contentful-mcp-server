import { describe, it, expect, beforeEach, vi } from 'vitest';
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('should create an environment with sourceEnvironmentId', async () => {
    const testArgs = {
      ...mockArgs,
      environmentId: 'new-test-env-with-source',
      name: 'New Test Environment With Source',
      sourceEnvironmentId: 'source-env-id',
    };
    mockEnvironmentCreateWithId.mockResolvedValue(testEnvironment);

    const tool = createEnvironmentTool(mockConfig);
    const result = await tool(testArgs);
    expect(createToolClient).toHaveBeenCalledWith(mockConfig, testArgs);
    expect(mockEnvironmentCreateWithId).toHaveBeenCalledWith(
      {
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
        sourceEnvironmentId: testArgs.sourceEnvironmentId,
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

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = createEnvironmentTool(protectedConfig);
    const result = await tool({
      ...mockArgs,
      environmentId: 'master',
      name: 'Master',
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error creating environment: Environment 'master' is protected. Write and delete operations are not allowed.",
        },
      ],
    });
    expect(mockEnvironmentCreateWithId).not.toHaveBeenCalled();
  });
});
