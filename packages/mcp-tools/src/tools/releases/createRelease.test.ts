import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createReleaseTool } from './createRelease.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockReleaseCreate,
  mockArgs,
  mockRelease,
} from './mockClient.js';

vi.mock('../../utils/tools.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../utils/tools.js')>();
  return {
    ...orig,
    createToolClient: vi.fn(),
  };
});
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('createRelease', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  it('should create a release successfully', async () => {
    const testArgs = {
      ...mockArgs,
      title: 'Test Release',
      entities: [
        { id: 'entry-1', linkType: 'Entry' as const },
        { id: 'asset-1', linkType: 'Asset' as const },
      ],
    };

    mockReleaseCreate.mockResolvedValue(mockRelease);

    const tool = createReleaseTool(mockConfig);
    const result = await tool(testArgs);

    expect(mockReleaseCreate).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
      },
      {
        title: 'Test Release',
        entities: {
          sys: { type: 'Array' },
          items: [
            { sys: { type: 'Link', linkType: 'Entry', id: 'entry-1' } },
            { sys: { type: 'Link', linkType: 'Asset', id: 'asset-1' } },
          ],
        },
      },
    );

    const expectedResponse = formatResponse('Release created successfully', {
      release: mockRelease,
    });
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
  });

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = createReleaseTool(protectedConfig);
    const result = await tool({
      ...mockArgs,
      environmentId: 'master',
      title: 'Test Release',
      entities: [{ id: 'entry-1', linkType: 'Entry' as const }],
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error creating release: Environment 'master' is protected. Write and delete operations are not allowed.",
        },
      ],
    });
    expect(mockReleaseCreate).not.toHaveBeenCalled();
  });

  it('should handle errors when release creation fails', async () => {
    const error = new Error('Validation failed');
    mockReleaseCreate.mockRejectedValue(error);

    const tool = createReleaseTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      title: 'Test Release',
      entities: [{ id: 'entry-1', linkType: 'Entry' as const }],
    });

    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error creating release: Validation failed' },
      ],
    });
  });
});
