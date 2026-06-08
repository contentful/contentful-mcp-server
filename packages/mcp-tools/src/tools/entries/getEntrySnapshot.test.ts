import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getEntrySnapshotTool } from './getEntrySnapshot.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockSnapshotGetManyForEntry,
  mockSnapshotGetForEntry,
  mockEntrySnapshot,
  mockEntrySnapshotCollection,
} from './mockClient.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

vi.mock('../../../src/utils/tools.js');

describe('getEntrySnapshot', () => {
  const mockConfig = createMockConfig();
  const baseArgs = {
    spaceId: 'test-space-id',
    environmentId: 'test-environment',
  };

  beforeEach(() => {
    setupMockClient();
    mockSnapshotGetManyForEntry.mockReset();
    mockSnapshotGetForEntry.mockReset();
  });

  it('lists snapshots when no snapshotId is provided', async () => {
    mockSnapshotGetManyForEntry.mockResolvedValue(mockEntrySnapshotCollection);

    const tool = getEntrySnapshotTool(mockConfig);
    const result = await tool({ ...baseArgs, entryId: 'test-entry-id' });

    expect(mockSnapshotGetManyForEntry).toHaveBeenCalledWith({
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'test-entry-id',
    });
    expect(mockSnapshotGetForEntry).not.toHaveBeenCalled();

    const expectedResponse = formatResponse(
      'Entry snapshots retrieved successfully',
      { snapshots: mockEntrySnapshotCollection },
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
  });

  it('returns a single snapshot when snapshotId is provided', async () => {
    mockSnapshotGetForEntry.mockResolvedValue(mockEntrySnapshot);

    const tool = getEntrySnapshotTool(mockConfig);
    const result = await tool({
      ...baseArgs,
      entryId: 'test-entry-id',
      snapshotId: 'test-snapshot-id',
    });

    expect(mockSnapshotGetForEntry).toHaveBeenCalledWith({
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'test-entry-id',
      snapshotId: 'test-snapshot-id',
    });
    expect(mockSnapshotGetManyForEntry).not.toHaveBeenCalled();

    const expectedResponse = formatResponse(
      'Entry snapshot retrieved successfully',
      { snapshot: mockEntrySnapshot },
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
  });

  it('handles errors when snapshot retrieval fails', async () => {
    mockSnapshotGetManyForEntry.mockRejectedValue(
      new Error('Snapshot not found'),
    );

    const tool = getEntrySnapshotTool(mockConfig);
    const result = await tool({ ...baseArgs, entryId: 'test-entry-id' });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving entry snapshot: Snapshot not found',
        },
      ],
    });
  });
});
