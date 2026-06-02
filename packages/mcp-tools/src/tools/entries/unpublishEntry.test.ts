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
import { createMockConfig } from '../../test-helpers/mockConfig.js';

vi.mock('../../utils/tools.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../utils/tools.js')>();
  return {
    ...orig,
    createToolClient: vi.fn(),
  };
});
vi.mock('../../../src/utils/bulkOperations.js');

describe('unpublishEntry', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    vi.clearAllMocks();
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

    const tool = unpublishEntryTool(mockConfig);
    const result = await tool(mockArgs);

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

    const tool = unpublishEntryTool(mockConfig);
    const result = await tool(mockArgs);

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

    const tool = unpublishEntryTool(mockConfig);
    const result = await tool(mockBulkArgs);

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

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = unpublishEntryTool(protectedConfig);
    const result = await tool({ ...mockArgs, environmentId: 'master' });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error unpublishing entry: Environment 'master' is protected. Write and delete operations are not allowed.",
        },
      ],
    });
    expect(mockEntryUnpublish).not.toHaveBeenCalled();
  });

  it('should handle errors when entry unpublishing fails', async () => {
    const error = new Error('Entry not found');
    mockEntryGet.mockRejectedValue(error);

    const tool = unpublishEntryTool(mockConfig);
    const result = await tool(mockArgs);

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
