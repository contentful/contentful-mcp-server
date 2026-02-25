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
import { createMockConfig } from '../../test-helpers/mockConfig.js';

vi.mock('../../../src/utils/tools.js');

describe('updateEntry', () => {
  const mockConfig = createMockConfig();

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

    const tool = updateEntryTool(mockConfig);
    const result = await tool(testArgs);

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
        concepts: [
          {
            sys: {
              type: 'Link' as const,
              linkType: 'TaxonomyConcept' as const,
              id: 'concept-id-123',
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
        concepts: [
          {
            sys: {
              type: 'Link' as const,
              linkType: 'TaxonomyConcept' as const,
              id: 'existing-concept-id',
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
        concepts: [
          {
            sys: {
              type: 'Link' as const,
              linkType: 'TaxonomyConcept' as const,
              id: 'existing-concept-id',
            },
          },
          {
            sys: {
              type: 'Link' as const,
              linkType: 'TaxonomyConcept' as const,
              id: 'concept-id-123',
            },
          },
        ],
      },
    };

    mockEntryGet.mockResolvedValue(mockExistingEntry);
    mockEntryUpdate.mockResolvedValue(mockUpdatedEntry);

    const tool = updateEntryTool(mockConfig);
    const result = await tool(testArgs);

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

    // Verify that the entry.update was called with the correct merged concepts
    expect(mockEntryUpdate).toHaveBeenCalledWith(
      {
        spaceId: 'test-space-id',
        environmentId: 'test-environment',
        entryId: 'test-entry-id',
      },
      expect.objectContaining({
        metadata: expect.objectContaining({
          tags: [
            {
              sys: {
                id: 'existing-tag-id',
                linkType: 'Tag',
                type: 'Link',
              },
            },
            {
              sys: {
                id: 'new-tag-id',
                linkType: 'Tag',
                type: 'Link',
              },
            },
          ],
          concepts: [
            {
              sys: {
                type: 'Link',
                linkType: 'TaxonomyConcept',
                id: 'existing-concept-id',
              },
            },
            {
              sys: {
                type: 'Link',
                linkType: 'TaxonomyConcept',
                id: 'concept-id-123',
              },
            },
          ],
        }),
      }),
    );
  });

  it('should update an entry with rich text fields in multiple locales', async () => {
    const richTextEnUS = {
      nodeType: 'document',
      data: {},
      content: [
        {
          nodeType: 'paragraph',
          data: {},
          content: [
            {
              nodeType: 'text',
              value: 'Updated ',
              marks: [],
              data: {},
            },
            {
              nodeType: 'text',
              value: 'content',
              marks: [{ type: 'bold' }, { type: 'underline' }],
              data: {},
            },
          ],
        },
      ],
    };

    const richTextFr = {
      nodeType: 'document',
      data: {},
      content: [
        {
          nodeType: 'paragraph',
          data: {},
          content: [
            {
              nodeType: 'text',
              value: 'Contenu ',
              marks: [],
              data: {},
            },
            {
              nodeType: 'text',
              value: 'mis à jour',
              marks: [{ type: 'italic' }],
              data: {},
            },
          ],
        },
      ],
    };

    const testArgs = {
      ...mockArgs,
      fields: {
        title: { 'en-US': 'Updated Title', fr: 'Titre mis à jour' },
        body: { 'en-US': richTextEnUS, fr: richTextFr },
      },
    };

    const mockExistingEntry = {
      ...mockEntry,
      fields: {
        title: { 'en-US': 'Original Title' },
        body: {
          'en-US': {
            nodeType: 'document',
            data: {},
            content: [
              {
                nodeType: 'paragraph',
                data: {},
                content: [
                  {
                    nodeType: 'text',
                    value: 'Old content',
                    marks: [],
                    data: {},
                  },
                ],
              },
            ],
          },
        },
        category: { 'en-US': 'Existing Category' },
      },
      metadata: { tags: [] },
    };

    const mockUpdatedEntry = {
      ...mockExistingEntry,
      sys: { ...mockExistingEntry.sys, version: 2 },
      fields: {
        ...mockExistingEntry.fields,
        ...testArgs.fields,
      },
    };

    mockEntryGet.mockResolvedValue(mockExistingEntry);
    mockEntryUpdate.mockResolvedValue(mockUpdatedEntry);

    const tool = updateEntryTool(mockConfig);
    const result = await tool(testArgs);

    expect(mockEntryUpdate).toHaveBeenCalledWith(
      {
        spaceId: 'test-space-id',
        environmentId: 'test-environment',
        entryId: 'test-entry-id',
      },
      expect.objectContaining({
        fields: {
          title: { 'en-US': 'Updated Title', fr: 'Titre mis à jour' },
          body: { 'en-US': richTextEnUS, fr: richTextFr },
          category: { 'en-US': 'Existing Category' },
        },
      }),
    );

    const expectedResponse = formatResponse('Entry updated successfully', {
      updatedEntry: mockUpdatedEntry,
    });
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
  });

  it('should update an entry with rich text containing embedded and inline nodes', async () => {
    const richTextWithEmbeds = {
      nodeType: 'document',
      data: {},
      content: [
        {
          nodeType: 'paragraph',
          data: {},
          content: [
            { nodeType: 'text', value: 'See ', marks: [], data: {} },
            {
              nodeType: 'embedded-entry-inline',
              data: {
                target: {
                  sys: { type: 'Link', linkType: 'Entry', id: 'inline-entry' },
                },
              },
              content: [],
            },
            { nodeType: 'text', value: ' for details.', marks: [], data: {} },
          ],
        },
        {
          nodeType: 'embedded-asset-block',
          data: {
            target: {
              sys: { type: 'Link', linkType: 'Asset', id: 'hero-image' },
            },
          },
          content: [],
        },
        {
          nodeType: 'ordered-list',
          data: {},
          content: [
            {
              nodeType: 'list-item',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  data: {},
                  content: [
                    {
                      nodeType: 'text',
                      value: 'First item',
                      marks: [],
                      data: {},
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const testArgs = {
      ...mockArgs,
      fields: {
        body: { 'en-US': richTextWithEmbeds },
      },
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
      fields: { ...mockExistingEntry.fields, ...testArgs.fields },
    };

    mockEntryGet.mockResolvedValue(mockExistingEntry);
    mockEntryUpdate.mockResolvedValue(mockUpdatedEntry);

    const tool = updateEntryTool(mockConfig);
    const result = await tool(testArgs);

    expect(mockEntryUpdate).toHaveBeenCalledWith(
      {
        spaceId: 'test-space-id',
        environmentId: 'test-environment',
        entryId: 'test-entry-id',
      },
      expect.objectContaining({
        fields: {
          title: { 'en-US': 'Existing Title' },
          body: { 'en-US': richTextWithEmbeds },
        },
      }),
    );

    const expectedResponse = formatResponse('Entry updated successfully', {
      updatedEntry: mockUpdatedEntry,
    });
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
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

    const tool = updateEntryTool(mockConfig);
    const result = await tool(testArgs);

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

    const tool = updateEntryTool(mockConfig);
    const result = await tool(testArgs);

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

    const tool = updateEntryTool(mockConfig);
    const result = await tool(testArgs);

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
