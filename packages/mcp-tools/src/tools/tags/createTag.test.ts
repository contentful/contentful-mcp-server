import { describe, it, expect } from 'vitest';
import { mockArgs, testTag, mockTagCreateWithId } from './mockClient.js';

import { createTagTool } from './createTag.js';
import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';

describe('createTag', () => {
  it('should create a tag successfully', async () => {
    const testArgs = {
      ...mockArgs,
      id: 'new-tag',
      name: 'New Tag',
      visibility: 'public' as const,
    };
    mockTagCreateWithId.mockResolvedValue(testTag);

    const result = await createTagTool(testArgs);
    expect(createToolClient).toHaveBeenCalledWith(testArgs);
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

  it('should handle errors when tag creation fails', async () => {
    const testArgs = {
      ...mockArgs,
      id: 'invalid-tag',
      name: 'Invalid Tag',
      visibility: 'private' as const,
    };

    const error = new Error('Validation error');
    mockTagCreateWithId.mockRejectedValue(error);

    const result = await createTagTool(testArgs);

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
