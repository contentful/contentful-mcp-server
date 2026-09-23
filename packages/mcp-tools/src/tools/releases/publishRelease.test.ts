import { describe, it, expect, beforeEach, vi } from 'vitest';
import { publishReleaseTool } from './publishRelease.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockReleaseGet,
  mockReleasePublish,
  mockArgs,
  mockRelease,
  mockReleaseAction,
} from './mockClient.js';

vi.mock('../../utils/tools.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../utils/tools.js')>();
  return {
    ...orig,
    createToolClient: vi.fn(),
  };
});
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('publishRelease', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  it('publishes a release and returns the queued action without polling', async () => {
    mockReleaseGet.mockResolvedValue(mockRelease);
    mockReleasePublish.mockResolvedValue(mockReleaseAction);

    const tool = publishReleaseTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockReleaseGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      releaseId: mockArgs.releaseId,
    });

    expect(mockReleasePublish).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      releaseId: mockArgs.releaseId,
      version: mockRelease.sys.version,
    });

    const expectedResponse = formatResponse('Release publish queued', {
      actionId: mockReleaseAction.sys.id,
      status: mockReleaseAction.sys.status,
      releaseId: mockArgs.releaseId,
      note: 'Use get_release_action with this actionId to check whether the publish succeeded.',
    });
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
  });

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = publishReleaseTool(protectedConfig);
    const result = await tool({ ...mockArgs, environmentId: 'master' });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error publishing release: Environment 'master' is protected. Write and delete operations are not allowed.",
        },
      ],
    });
    expect(mockReleaseGet).not.toHaveBeenCalled();
    expect(mockReleasePublish).not.toHaveBeenCalled();
  });

  it('handles errors when release retrieval fails', async () => {
    mockReleaseGet.mockRejectedValue(new Error('Release not found'));

    const tool = publishReleaseTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockReleasePublish).not.toHaveBeenCalled();
    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error publishing release: Release not found' },
      ],
    });
  });

  it('handles errors when publish call fails', async () => {
    mockReleaseGet.mockResolvedValue(mockRelease);
    mockReleasePublish.mockRejectedValue(new Error('Release is archived'));

    const tool = publishReleaseTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error publishing release: Release is archived' },
      ],
    });
  });
});
