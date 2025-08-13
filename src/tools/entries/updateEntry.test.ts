import { describe, it, expect, beforeEach, vi } from 'vitest';
import { updateEntryTool } from './updateEntry.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockEntryGet,
  mockEntryUpdate,
  mockEntry,
  mockArgs,
} from './mockClient.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('updateEntry', () => {
  beforeEach(() => {
    setupMockClient();
  });

  it('should update an entry successfully with fields only', async () => {
    const testArgs = {
      ...mockArgs,
      fields: {
        title: { 'en-US': 'Updated Title' },
        description: { 'en-US': 'Updated Description' },
      },
    };

    const mockExistingEntry = {
      ...mockEntry,
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

    const result = await updateEntryTool(testArgs);

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
    const testArgs = {
      ...mockArgs,
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
      ...mockEntry,
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
      fields: testArgs.fields,
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

    const result = await updateEntryTool(testArgs);

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
    const testArgs = {
      ...mockArgs,
      fields: {},
    };

    const mockExistingEntry = {
      ...mockEntry,
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

    const result = await updateEntryTool(testArgs);

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
    const testArgs = {
      ...mockArgs,
      entryId: 'non-existent-entry',
      fields: {
        title: { 'en-US': 'Updated Title' },
      },
    };

    const error = new Error('Entry not found');
    mockEntryGet.mockRejectedValue(error);

    const result = await updateEntryTool(testArgs);

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
    const testArgs = {
      ...mockArgs,
      fields: {
        title: { 'en-US': 'Updated Title' },
      },
    };

    const mockExistingEntry = {
      ...mockEntry,
      fields: { title: { 'en-US': 'Original Title' } },
      metadata: { tags: [] },
    };

    const updateError = new Error('Update failed');
    mockEntryGet.mockResolvedValue(mockExistingEntry);
    mockEntryUpdate.mockRejectedValue(updateError);

    const result = await updateEntryTool(testArgs);

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
