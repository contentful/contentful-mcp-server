import { describe, it, expect, vi } from 'vitest';
import { mockArgs, testTag, mockTagCreateWithId } from './mockClient.js';

import { createTagTool } from './createTag.js';
import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

vi.mock('../../utils/tools.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../utils/tools.js')>();
  return { ...orig, createToolClient: vi.fn() };
});

describe('createTag', () => {
  const mockConfig = createMockConfig();
  it('should create a tag successfully', async () => {
    const testArgs = {
      ...mockArgs,
      id: 'new-tag',
      name: 'New Tag',
      visibility: 'public' as const,
    };
    mockTagCreateWithId.mockResolvedValue(testTag);

    const tool = createTagTool(mockConfig);
    const result = await tool(testArgs);
    expect(createToolClient).toHaveBeenCalledWith(mockConfig, testArgs);
    expect(mockTagCreateWithId).toHaveBeenCalledWith(
      {
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
        tagId: testArgs.id,
      },
      {
        name: testArgs.name,
        sys: { visibility: testArgs.visibility },
      },
    );

    const expectedResponse = formatResponse('Tag created successfully', {
      newTag: testTag,
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

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = createTagTool(protectedConfig);
    const result = await tool({
      ...mockArgs,
      environmentId: 'master',
      name: 'Test Tag',
      id: 'test-tag',
      visibility: 'private' as const,
    });
    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error creating tag: Environment 'master' is protected. Destructive operations are not allowed.",
        },
      ],
    });
  });

  it('should handle errors when tag creation fails', async () => {
    const testArgs = {
      ...mockArgs,
      id: 'invalid-tag',
      name: 'Invalid Tag',
      visibility: 'private' as const,
    };

    const error = new Error('Validation error');
    mockTagCreateWithId.mockRejectedValue(error);

    const tool = createTagTool(mockConfig);
    const result = await tool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error creating tag: Validation error',
        },
      ],
    });
  });
});
