import { describe, it, expect, beforeEach, vi } from 'vitest';
import { publishEntryTool } from './publishEntry.js';
import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');
vi.mock('../../../src/utils/bulkOperations.js');

describe('publishEntry', () => {
  const mockEntryGet = vi.fn();
  const mockEntryPublish = vi.fn();
  const mockBulkActionPublish = vi.fn();
  const mockClient = {
    entry: {
      get: mockEntryGet,
      publish: mockEntryPublish,
    },
    bulkAction: {
      publish: mockBulkActionPublish,
    },
  };

  beforeEach(() => {
    vi.mocked(createToolClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof createToolClient>,
    );
  });

  it('should publish a single entry successfully', async () => {
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
        version: 1,
      },
      fields: {
        title: { 'en-US': 'Test Entry Title' },
      },
    };

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

    expect(createToolClient).toHaveBeenCalledWith(mockArgs);
    expect(mockEntryGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      entryId: mockArgs.entryId,
    });
    expect(mockEntryPublish).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
        entryId: mockArgs.entryId,
      },
      mockEntry,
    );

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
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'test-entry-id',
    };

    const mockEntry = {
      sys: { id: 'test-entry-id', type: 'Entry' },
      fields: {},
    };

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
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: ['entry-1', 'entry-2'],
    };

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

    const result = await publishEntryTool(mockArgs);

    expect(createEntryVersionedLinks).toHaveBeenCalledWith(
      mockClient,
      { spaceId: mockArgs.spaceId, environmentId: mockArgs.environmentId },
      mockArgs.entryId,
    );
    expect(createEntitiesCollection).toHaveBeenCalledWith(mockEntityVersions);
    expect(mockBulkActionPublish).toHaveBeenCalledWith(
      { spaceId: mockArgs.spaceId, environmentId: mockArgs.environmentId },
      { entities: mockEntitiesCollection },
    );

    const expectedResponse = formatResponse('Entry(s) published successfully', {
      status: mockCompletedAction.sys.status,
      entryIds: mockArgs.entryId,
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
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'non-existent-entry',
    };

    const error = new Error('Entry not found');
    mockEntryGet.mockRejectedValue(error);

    const result = await publishEntryTool(mockArgs);

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
