import { describe, it, expect, beforeEach, vi } from 'vitest';
import { publishEntryTool } from './publishEntry.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockEntryGet,
  mockEntryPublish,
  mockBulkActionPublish,
  mockEntry,
  mockArgs,
  mockBulkArgs,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');
vi.mock('../../../src/utils/bulkOperations.js');

describe('publishEntry', () => {
  beforeEach(() => {
    setupMockClient();
  });

  it('should publish a single entry successfully', async () => {
    const mockPublishedEntry = {
      ...mockEntry,
      sys: {
        ...mockEntry.sys,
        status: 'published',
        publishedVersion: 1,
      },
    };

    mockEntryGet.mockResolvedValue(mockEntry);
    mockEntryPublish.mockResolvedValue(mockPublishedEntry);

    const result = await publishEntryTool(mockArgs);

    const expectedResponse = formatResponse('Entry published successfully', {
      status: mockPublishedEntry.sys.status,
      entryId: mockArgs.entryId,
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

  it('should handle single entry publish failure', async () => {
    const publishError = new Error('Publish failed');
    mockEntryGet.mockResolvedValue(mockEntry);
    mockEntryPublish.mockRejectedValue(publishError);

    const result = await publishEntryTool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error publishing entry: Publish failed',
        },
      ],
    });
  });

  it('should publish multiple entries using bulk action', async () => {
    // Mock bulk operations
    const {
      createEntryVersionedLinks,
      createEntitiesCollection,
      waitForBulkActionCompletion,
    } = await import('../../utils/bulkOperations.js');

    const mockEntityVersions = [
      {
        sys: {
          type: 'Link' as const,
          linkType: 'Entry' as const,
          id: 'entry-1',
          version: 1,
        },
      },
      {
        sys: {
          type: 'Link' as const,
          linkType: 'Entry' as const,
          id: 'entry-2',
          version: 1,
        },
      },
    ];

    const mockEntitiesCollection = {
      sys: { type: 'Array' as const },
      items: mockEntityVersions,
    };
    const mockBulkAction = { sys: { id: 'bulk-action-id' } };
    const mockCompletedAction = {
      sys: { id: 'bulk-action-id', status: 'succeeded' },
    };

    vi.mocked(createEntryVersionedLinks).mockResolvedValue(mockEntityVersions);
    vi.mocked(createEntitiesCollection).mockReturnValue(mockEntitiesCollection);
    vi.mocked(waitForBulkActionCompletion).mockResolvedValue(
      mockCompletedAction,
    );
    mockBulkActionPublish.mockResolvedValue(mockBulkAction);

    const result = await publishEntryTool(mockBulkArgs);

    const expectedResponse = formatResponse('Entry(s) published successfully', {
      status: mockCompletedAction.sys.status,
      entryIds: mockBulkArgs.entryId,
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

  it('should handle errors when entry publishing fails', async () => {
    const testArgs = {
      ...mockArgs,
      entryId: 'non-existent-entry',
    };

    const error = new Error('Entry not found');
    mockEntryGet.mockRejectedValue(error);

    const result = await publishEntryTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error publishing entry: Entry not found',
        },
      ],
    });
  });
});
