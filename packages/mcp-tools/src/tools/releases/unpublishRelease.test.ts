import { describe, it, expect, beforeEach, vi } from 'vitest';
import { unpublishReleaseTool } from './unpublishRelease.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockReleaseGet,
  mockReleaseUnpublish,
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

describe('unpublishRelease', () => {
  const mockConfig = createMockConfig();
  const unpublishAction = {
    ...mockReleaseAction,
    action: 'unpublish' as const,
  };

  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  it('unpublishes a release and returns the queued action without polling', async () => {
    mockReleaseGet.mockResolvedValue(mockRelease);
    mockReleaseUnpublish.mockResolvedValue(unpublishAction);

    const tool = unpublishReleaseTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockReleaseGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      releaseId: mockArgs.releaseId,
    });

    expect(mockReleaseUnpublish).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      releaseId: mockArgs.releaseId,
      version: mockRelease.sys.version,
    });

    const expectedResponse = formatResponse('Release unpublish queued', {
      actionId: unpublishAction.sys.id,
      status: unpublishAction.sys.status,
      releaseId: mockArgs.releaseId,
      note: 'Use get_release_action with this actionId to check whether the unpublish succeeded.',
    });
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
  });

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = unpublishReleaseTool(protectedConfig);
    const result = await tool({ ...mockArgs, environmentId: 'master' });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error unpublishing release: Environment 'master' is protected. Write and delete operations are not allowed.",
        },
      ],
    });
    expect(mockReleaseGet).not.toHaveBeenCalled();
    expect(mockReleaseUnpublish).not.toHaveBeenCalled();
  });

  it('handles errors when release retrieval fails', async () => {
    mockReleaseGet.mockRejectedValue(new Error('Release not found'));

    const tool = unpublishReleaseTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockReleaseUnpublish).not.toHaveBeenCalled();
    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error unpublishing release: Release not found' },
      ],
    });
  });

  it('handles errors when unpublish call fails', async () => {
    mockReleaseGet.mockResolvedValue(mockRelease);
    mockReleaseUnpublish.mockRejectedValue(new Error('Nothing to unpublish'));

    const tool = unpublishReleaseTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error unpublishing release: Nothing to unpublish',
        },
      ],
    });
  });
});
