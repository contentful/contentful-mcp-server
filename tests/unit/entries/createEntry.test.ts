import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEntryTool } from '../../../src/tools/entries/createEntry.js';
import { createToolClient } from '../../../src/utils/tools.js';
import { resetAllMocks } from '../../helpers/testUtils.js';

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
    resetAllMocks();
    vi.mocked(createToolClient).mockReturnValue(
      mockClient as unknown as ReturnType<typeof createToolClient>,
    );
  });

  it('should create an entry successfully', async () => {
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
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expect.stringContaining('Entry created successfully'),
        },
      ],
    });
  });

  it('should handle metadata when provided', async () => {
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
    };

    mockEntryCreate.mockResolvedValue(mockCreatedEntry);

    await createEntryTool(mockArgs);

    expect(mockEntryCreate).toHaveBeenCalledWith(expect.any(Object), {
      fields: mockArgs.fields,
      metadata: mockArgs.metadata,
    });
  });
});
