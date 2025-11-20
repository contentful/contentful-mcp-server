import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createEntryTool } from './createEntry.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockEntryCreate,
  mockEntry,
  mockArgs,
} from './mockClient.js';
import { createToolClient } from '../../utils/tools.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

vi.mock('../../utils/tools.js');

describe('createEntry', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
  });

  it('should create entry with empty fields object', async () => {
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'test-content-type',
      fields: {},
    };

    const mockCreatedEntry = {
      ...mockEntry,
      fields: {},
    };

    mockEntryCreate.mockResolvedValue(mockCreatedEntry);

    const tool = createEntryTool(mockConfig);
    const result = await tool(testArgs);

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
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'test-content-type',
      fields: {
        title: { 'en-US': 'Test Entry Title' },
        description: { 'en-US': 'Test Entry Description' },
      },
    };

    mockEntryCreate.mockResolvedValue(mockEntry);

    const tool = createEntryTool(mockConfig);
    const result = await tool(testArgs);

    expect(createToolClient).toHaveBeenCalledWith(mockConfig, testArgs);

    const expectedResponse = formatResponse('Entry created successfully', {
      newEntry: mockEntry,
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
    const testMetadata = {
      tags: [
        {
          sys: {
            type: 'Link' as const,
            linkType: 'Tag' as const,
            id: 'test-tag-id',
          },
        },
      ],
      concepts: [
        {
          sys: {
            type: 'Link' as const,
            linkType: 'TaxonomyConcept' as const,
            id: 'test-concept-id',
          },
        },
      ],
    };

    const testArgs = {
      ...mockArgs,
      contentTypeId: 'test-content-type',
      fields: {
        title: { 'en-US': 'Test Entry Title' },
      },
      metadata: testMetadata,
    };

    const mockCreatedEntry = {
      ...mockEntry,
      metadata: testMetadata,
    };

    mockEntryCreate.mockResolvedValue(mockCreatedEntry);

    const tool = createEntryTool(mockConfig);
    const result = await tool(testArgs);

    expect(mockEntryCreate).toHaveBeenCalledWith(expect.any(Object), {
      fields: testArgs.fields,
      metadata: testArgs.metadata,
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
    const testArgs = {
      ...mockArgs,
      contentTypeId: 'invalid-content-type',
      fields: {
        title: { 'en-US': 'Test Entry' },
      },
    };

    const error = new Error('Content type not found');
    mockEntryCreate.mockRejectedValue(error);

    const tool = createEntryTool(mockConfig);
    const result = await tool(testArgs);

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
