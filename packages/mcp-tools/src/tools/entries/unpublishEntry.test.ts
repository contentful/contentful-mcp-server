import { describe, it, expect, beforeEach, vi } from 'vitest';
import { unpublishEntryTool } from './unpublishEntry.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockEntryGet,
  mockEntryUnpublish,
  mockBulkActionUnpublish,
  mockEntry,
  mockArgs,
  mockBulkArgs,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');
vi.mock('../../../src/utils/bulkOperations.js');

describe('unpublishEntry', () => {
  beforeEach(() => {
    setupMockClient();
  });

  it('should unpublish a single entry successfully', async () => {
    const mockPublishedEntry = {
      ...mockEntry,
      sys: {
        ...mockEntry.sys,
        status: 'published',
        publishedVersion: 1,
      },
    };

    const mockUnpublishedEntry = {
      ...mockPublishedEntry,
      sys: {
        ...mockPublishedEntry.sys,
        status: 'draft',
        publishedVersion: undefined,
      },
    };

    mockEntryGet.mockResolvedValue(mockPublishedEntry);
    mockEntryUnpublish.mockResolvedValue(mockUnpublishedEntry);

    const result = await unpublishEntryTool(mockArgs);

    const expectedResponse = formatResponse('Entry unpublished successfully', {
      status: mockUnpublishedEntry.sys.status,
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

  it('should handle single entry unpublish failure', async () => {
    const unpublishError = new Error('Unpublish failed');
    mockEntryGet.mockResolvedValue(mockEntry);
    mockEntryUnpublish.mockRejectedValue(unpublishError);

    const result = await unpublishEntryTool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error unpublishing entry: Unpublish failed',
        },
      ],
    });
  });

  it('should unpublish multiple entries using bulk action', async () => {
    // Mock bulk operations
    const {
      createEntryUnversionedLinks,
      createEntitiesCollection,
      waitForBulkActionCompletion,
    } = await import('../../utils/bulkOperations.js');

    const mockEntityLinks = [
      {
        sys: {
          type: 'Link' as const,
          linkType: 'Entry' as const,
          id: 'entry-1',
        },
      },
      {
        sys: {
          type: 'Link' as const,
          linkType: 'Entry' as const,
          id: 'entry-2',
        },
      },
    ];

    const mockEntitiesCollection = {
      sys: { type: 'Array' as const },
      items: mockEntityLinks,
    };
    const mockBulkAction = { sys: { id: 'bulk-action-id' } };
    const mockCompletedAction = {
      sys: { id: 'bulk-action-id', status: 'succeeded' },
    };

    vi.mocked(createEntryUnversionedLinks).mockResolvedValue(mockEntityLinks);
    vi.mocked(createEntitiesCollection).mockReturnValue(mockEntitiesCollection);
    vi.mocked(waitForBulkActionCompletion).mockResolvedValue(
      mockCompletedAction,
    );
    mockBulkActionUnpublish.mockResolvedValue(mockBulkAction);

    const result = await unpublishEntryTool(mockBulkArgs);

    const expectedResponse = formatResponse(
      'Entry(s) unpublished successfully',
      {
        status: mockCompletedAction.sys.status,
        entryIds: mockBulkArgs.entryId,
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

  it('should handle errors when entry unpublishing fails', async () => {
    const error = new Error('Entry not found');
    mockEntryGet.mockRejectedValue(error);

    const result = await unpublishEntryTool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error unpublishing entry: Entry not found',
        },
      ],
    });
  });
});
