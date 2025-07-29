import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEntryTool } from './createEntry.js';
import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';

vi.mock('../../../src/utils/tools.js');
vi.mock('../../../src/config/contentful.js');

describe('createEntry', () => {
  const mockEntryCreate = vi.fn();
  const mockClient = {
    entry: {
      create: mockEntryCreate,
    },
  };

  beforeEach(() => {
    vi.mocked(createToolClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof createToolClient>,
    );
  });

  it('should create entry with empty fields object', async () => {
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      contentTypeId: 'test-content-type',
      fields: {},
    };

    const mockCreatedEntry = {
      sys: { id: 'new-entry-id', type: 'Entry' },
      fields: {},
    };

    mockEntryCreate.mockResolvedValue(mockCreatedEntry);

    const result = await createEntryTool(mockArgs);

    const expectedResponse = formatResponse('Entry created successfully', {
      newEntry: mockCreatedEntry,
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

  it('should create an entry successfully with fields', async () => {
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      contentTypeId: 'test-content-type',
      fields: {
        title: { 'en-US': 'Test Entry Title' },
        description: { 'en-US': 'Test Entry Description' },
      },
    };

    const mockCreatedEntry = {
      sys: {
        id: 'new-entry-id',
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
      fields: mockArgs.fields,
    };

    mockEntryCreate.mockResolvedValue(mockCreatedEntry);

    const result = await createEntryTool(mockArgs);

    expect(createToolClient).toHaveBeenCalledWith(mockArgs);

    const expectedResponse = formatResponse('Entry created successfully', {
      newEntry: mockCreatedEntry,
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

  it('should create an entry with metadata', async () => {
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      contentTypeId: 'test-content-type',
      fields: {
        title: { 'en-US': 'Test Entry Title' },
      },
      metadata: {
        tags: [
          {
            sys: {
              type: 'Link' as const,
              linkType: 'Tag' as const,
              id: 'test-tag-id',
            },
          },
        ],
      },
    };

    const mockCreatedEntry = {
      sys: { id: 'new-entry-id', type: 'Entry' },
      fields: mockArgs.fields,
      metadata: mockArgs.metadata,
    };

    mockEntryCreate.mockResolvedValue(mockCreatedEntry);

    const result = await createEntryTool(mockArgs);

    expect(mockEntryCreate).toHaveBeenCalledWith(expect.any(Object), {
      fields: mockArgs.fields,
      metadata: mockArgs.metadata,
    });
    const expectedResponse = formatResponse('Entry created successfully', {
      newEntry: mockCreatedEntry,
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

  it('should handle errors when entry creation fails', async () => {
    const mockArgs = {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      contentTypeId: 'invalid-content-type',
      fields: {
        title: { 'en-US': 'Test Entry' },
      },
    };

    const error = new Error('Content type not found');
    mockEntryCreate.mockRejectedValue(error);

    const result = await createEntryTool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error creating entry: Content type not found',
        },
      ],
    });
  });
});
