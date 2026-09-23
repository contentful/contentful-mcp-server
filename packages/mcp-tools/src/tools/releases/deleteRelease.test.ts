import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deleteReleaseTool } from './deleteRelease.js';
import { formatResponse } from '../../utils/formatters.js';
import { buildConfirmToken } from '../../utils/confirmation.js';
import {
  setupMockClient,
  mockReleaseGet,
  mockReleaseDelete,
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

describe('deleteRelease', () => {
  const mockConfig = createMockConfig();
  const validToken = buildConfirmToken(
    'release',
    mockArgs.releaseId,
    mockRelease.sys.version,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    setupMockClient();
  });

  it('returns a confirmation preview when confirm is missing', async () => {
    mockReleaseGet.mockResolvedValue(mockRelease);

    const tool = deleteReleaseTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockReleaseDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
    expect(result.content[0].text).toContain(validToken);
    expect(result.content[0].text).toContain('ReleaseActions');
  });

  it('returns a confirmation preview when confirmToken is wrong', async () => {
    mockReleaseGet.mockResolvedValue(mockRelease);

    const tool = deleteReleaseTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: 'wrong',
    });

    expect(mockReleaseDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('deletes when confirm is true and confirmToken matches', async () => {
    mockReleaseGet.mockResolvedValue(mockRelease);
    mockReleaseDelete.mockResolvedValue(undefined);

    const tool = deleteReleaseTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: validToken,
    });

    expect(mockReleaseDelete).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      releaseId: mockArgs.releaseId,
    });
    const expected = formatResponse('Release deleted successfully', {
      release: mockRelease,
    });
    expect(result).toEqual({ content: [{ type: 'text', text: expected }] });
  });

  it('handles errors when release get fails before confirmation', async () => {
    mockReleaseGet.mockRejectedValue(new Error('Release not found'));

    const tool = deleteReleaseTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockReleaseDelete).not.toHaveBeenCalled();
    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error deleting release: Release not found' },
      ],
    });
  });

  it('handles errors when deletion fails after confirmation', async () => {
    mockReleaseGet.mockResolvedValue(mockRelease);
    mockReleaseDelete.mockRejectedValue(new Error('Release deletion failed'));

    const tool = deleteReleaseTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: validToken,
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error deleting release: Release deletion failed',
        },
      ],
    });
  });

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = deleteReleaseTool(protectedConfig);
    const result = await tool({ ...mockArgs, environmentId: 'master' });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error deleting release: Environment 'master' is protected. Write and delete operations are not allowed.",
        },
      ],
    });
    expect(mockReleaseDelete).not.toHaveBeenCalled();
  });
});
