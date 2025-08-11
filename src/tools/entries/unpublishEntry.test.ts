import { describe, it, expect, beforeEach, vi } from 'vitest';
import { unpublishEntryTool } from './unpublishEntry.js';
import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');
vi.mock('../../../src/utils/bulkOperations.js');

describe('unpublishEntry', () => {
  const mockEntryGet = vi.fn();
  const mockEntryUnpublish = vi.fn();
  const mockBulkActionUnpublish = vi.fn();
  const mockClient = {
    entry: {
      get: mockEntryGet,
      unpublish: mockEntryUnpublish,
    },
    bulkAction: {
      unpublish: mockBulkActionUnpublish,
    },
  };

  beforeEach(() => {
    vi.mocked(createToolClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof createToolClient>,
    );
  });

  it('should unpublish a single entry successfully', async () => {
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'test-entry-id',
    };

    const mockEntry = {
      sys: {
        id: 'test-entry-id',
        type: 'Entry',
        contentType: {
          sys: {
            id: 'test-content-type',
            type: 'Link',
            linkType: 'ContentType',
          },
        },
        version: 2,
        publishedVersion: 1,
      },
      fields: {
        title: { 'en-US': 'Test Entry Title' },
      },
    };

    const mockUnpublishedEntry = {
      ...mockEntry,
      sys: {
        ...mockEntry.sys,
        status: 'draft',
        publishedVersion: undefined,
      },
    };

    mockEntryGet.mockResolvedValue(mockEntry);
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
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'test-entry-id',
    };

    const mockEntry = {
      sys: { id: 'test-entry-id', type: 'Entry' },
      fields: {},
    };

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
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: ['entry-1', 'entry-2'],
    };

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

    const result = await unpublishEntryTool(mockArgs);

    const expectedResponse = formatResponse(
      'Entry(s) unpublished successfully',
      {
        status: mockCompletedAction.sys.status,
        entryIds: mockArgs.entryId,
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
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'non-existent-entry',
    };

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
