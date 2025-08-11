import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateEntryTool } from './updateEntry.js';
import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('updateEntry', () => {
  const mockEntryGet = vi.fn();
  const mockEntryUpdate = vi.fn();
  const mockClient = {
    entry: {
      get: mockEntryGet,
      update: mockEntryUpdate,
    },
  };

  beforeEach(() => {
    vi.mocked(createToolClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof createToolClient>,
    );
  });

  it('should update an entry successfully with fields only', async () => {
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'test-entry-id',
      fields: {
        title: { 'en-US': 'Updated Title' },
        description: { 'en-US': 'Updated Description' },
      },
    };

    const mockExistingEntry = {
      sys: {
        id: 'test-entry-id',
        type: 'Entry',
        version: 1,
      },
      fields: {
        title: { 'en-US': 'Original Title' },
        category: { 'en-US': 'Existing Category' },
      },
      metadata: {
        tags: [],
      },
    };

    const mockUpdatedEntry = {
      ...mockExistingEntry,
      sys: {
        ...mockExistingEntry.sys,
        version: 2,
      },
      fields: {
        title: { 'en-US': 'Updated Title' },
        description: { 'en-US': 'Updated Description' },
        category: { 'en-US': 'Existing Category' },
      },
    };

    mockEntryGet.mockResolvedValue(mockExistingEntry);
    mockEntryUpdate.mockResolvedValue(mockUpdatedEntry);

    const result = await updateEntryTool(mockArgs);

    expect(createToolClient).toHaveBeenCalledWith(mockArgs);
    expect(mockEntryGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      entryId: mockArgs.entryId,
    });
    expect(mockEntryUpdate).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
        entryId: mockArgs.entryId,
      },
      {
        ...mockExistingEntry,
        fields: {
          title: { 'en-US': 'Updated Title' },
          description: { 'en-US': 'Updated Description' },
          category: { 'en-US': 'Existing Category' },
        },
        metadata: {
          tags: [],
        },
      },
    );

    const expectedResponse = formatResponse('Entry updated successfully', {
      updatedEntry: mockUpdatedEntry,
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

  it('should update an entry with metadata tags', async () => {
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'test-entry-id',
      fields: {
        title: { 'en-US': 'Updated Title' },
      },
      metadata: {
        tags: [
          {
            sys: {
              type: 'Link' as const,
              linkType: 'Tag' as const,
              id: 'new-tag-id',
            },
          },
        ],
      },
    };

    const mockExistingEntry = {
      sys: { id: 'test-entry-id', type: 'Entry', version: 1 },
      fields: {
        title: { 'en-US': 'Original Title' },
      },
      metadata: {
        tags: [
          {
            sys: {
              type: 'Link' as const,
              linkType: 'Tag' as const,
              id: 'existing-tag-id',
            },
          },
        ],
      },
    };

    const mockUpdatedEntry = {
      ...mockExistingEntry,
      sys: { ...mockExistingEntry.sys, version: 2 },
      fields: mockArgs.fields,
      metadata: {
        tags: [
          {
            sys: {
              type: 'Link' as const,
              linkType: 'Tag' as const,
              id: 'existing-tag-id',
            },
          },
          {
            sys: {
              type: 'Link' as const,
              linkType: 'Tag' as const,
              id: 'new-tag-id',
            },
          },
        ],
      },
    };

    mockEntryGet.mockResolvedValue(mockExistingEntry);
    mockEntryUpdate.mockResolvedValue(mockUpdatedEntry);

    const result = await updateEntryTool(mockArgs);

    expect(mockEntryUpdate).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
        entryId: mockArgs.entryId,
      },
      {
        ...mockExistingEntry,
        fields: mockArgs.fields,
        metadata: {
          tags: [
            {
              sys: {
                type: 'Link',
                linkType: 'Tag',
                id: 'existing-tag-id',
              },
            },
            {
              sys: {
                type: 'Link',
                linkType: 'Tag',
                id: 'new-tag-id',
              },
            },
          ],
        },
      },
    );

    const expectedResponse = formatResponse('Entry updated successfully', {
      updatedEntry: mockUpdatedEntry,
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

  it('should update an entry with empty fields', async () => {
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'test-entry-id',
      fields: {},
    };

    const mockExistingEntry = {
      sys: { id: 'test-entry-id', type: 'Entry', version: 1 },
      fields: {
        title: { 'en-US': 'Existing Title' },
      },
      metadata: { tags: [] },
    };

    const mockUpdatedEntry = {
      ...mockExistingEntry,
      sys: { ...mockExistingEntry.sys, version: 2 },
    };

    mockEntryGet.mockResolvedValue(mockExistingEntry);
    mockEntryUpdate.mockResolvedValue(mockUpdatedEntry);

    const result = await updateEntryTool(mockArgs);

    expect(mockEntryUpdate).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
        entryId: mockArgs.entryId,
      },
      {
        ...mockExistingEntry,
        fields: mockExistingEntry.fields,
        metadata: { tags: [] },
      },
    );

    const expectedResponse = formatResponse('Entry updated successfully', {
      updatedEntry: mockUpdatedEntry,
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

  it('should handle errors when entry update fails', async () => {
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'non-existent-entry',
      fields: {
        title: { 'en-US': 'Updated Title' },
      },
    };

    const error = new Error('Entry not found');
    mockEntryGet.mockRejectedValue(error);

    const result = await updateEntryTool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error updating entry: Entry not found',
        },
      ],
    });
  });

  it('should handle errors when entry retrieval succeeds but update fails', async () => {
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      entryId: 'test-entry-id',
      fields: {
        title: { 'en-US': 'Updated Title' },
      },
    };

    const mockExistingEntry = {
      sys: { id: 'test-entry-id', type: 'Entry', version: 1 },
      fields: { title: { 'en-US': 'Original Title' } },
      metadata: { tags: [] },
    };

    const updateError = new Error('Update failed');
    mockEntryGet.mockResolvedValue(mockExistingEntry);
    mockEntryUpdate.mockRejectedValue(updateError);

    const result = await updateEntryTool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error updating entry: Update failed',
        },
      ],
    });
  });
});
