import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateReleaseTool } from './updateRelease.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockReleaseGet,
  mockReleaseUpdate,
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

describe('updateRelease', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  it('should update a release title, keeping existing entities', async () => {
    mockReleaseGet.mockResolvedValue(mockRelease);
    const updatedRelease = { ...mockRelease, title: 'Renamed Release' };
    mockReleaseUpdate.mockResolvedValue(updatedRelease);

    const tool = updateReleaseTool(mockConfig);
    const result = await tool({ ...mockArgs, title: 'Renamed Release' });

    expect(mockReleaseGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      releaseId: mockArgs.releaseId,
    });

    expect(mockReleaseUpdate).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
        releaseId: mockArgs.releaseId,
        version: mockRelease.sys.version,
      },
      {
        title: 'Renamed Release',
        entities: mockRelease.entities,
      },
    );

    const expectedResponse = formatResponse('Release updated successfully', {
      release: updatedRelease,
    });
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
  });

  it('should update entities, keeping existing title when title is omitted', async () => {
    mockReleaseGet.mockResolvedValue(mockRelease);
    mockReleaseUpdate.mockResolvedValue(mockRelease);

    const tool = updateReleaseTool(mockConfig);
    await tool({
      ...mockArgs,
      entities: [{ id: 'entry-2', linkType: 'Entry' as const }],
    });

    expect(mockReleaseUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ version: mockRelease.sys.version }),
      {
        title: mockRelease.title,
        entities: {
          sys: { type: 'Array' },
          items: [{ sys: { type: 'Link', linkType: 'Entry', id: 'entry-2' } }],
        },
      },
    );
  });

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = updateReleaseTool(protectedConfig);
    const result = await tool({
      ...mockArgs,
      environmentId: 'master',
      title: 'Should not happen',
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error updating release: Environment 'master' is protected. Write and delete operations are not allowed.",
        },
      ],
    });
    expect(mockReleaseGet).not.toHaveBeenCalled();
    expect(mockReleaseUpdate).not.toHaveBeenCalled();
  });

  it('should handle errors when release retrieval fails', async () => {
    mockReleaseGet.mockRejectedValue(new Error('Release not found'));

    const tool = updateReleaseTool(mockConfig);
    const result = await tool({ ...mockArgs, title: 'New title' });

    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error updating release: Release not found' },
      ],
    });
    expect(mockReleaseUpdate).not.toHaveBeenCalled();
  });

  it('should handle errors when release update fails', async () => {
    mockReleaseGet.mockResolvedValue(mockRelease);
    mockReleaseUpdate.mockRejectedValue(new Error('Version mismatch'));

    const tool = updateReleaseTool(mockConfig);
    const result = await tool({ ...mockArgs, title: 'New title' });

    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error updating release: Version mismatch' },
      ],
    });
  });
});
