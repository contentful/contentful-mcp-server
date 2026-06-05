import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  semanticSearchTool,
  SemanticSearchToolParams,
} from './semanticSearch.js';
import { formatResponse } from '../../utils/formatters.js';
import { setupMockClient, mockSemanticSearchGet } from './mockClient.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

vi.mock('../../utils/tools.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../utils/tools.js')>();
  return {
    ...orig,
    createToolClient: vi.fn(),
  };
});

const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
};

function semanticResult(ids: string[], correlationId?: string) {
  return {
    sys: {
      type: 'Array' as const,
      ...(correlationId ? { correlationId } : {}),
    },
    items: ids.map((id) => ({
      sys: {
        type: 'SemanticSearchResult' as const,
        entity: { sys: { type: 'Link', linkType: 'Entry', id } },
      },
    })),
  };
}

describe('semanticSearch', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
    mockSemanticSearchGet.mockReset();
  });

  it('should return mapped entry references and correlationId', async () => {
    mockSemanticSearchGet.mockResolvedValue(
      semanticResult(['entry-1', 'entry-2'], 'corr-123'),
    );

    const tool = semanticSearchTool(mockConfig);
    const result = await tool({ ...mockArgs, query: 'a red bicycle for kids' });

    const expectedResponse = formatResponse(
      'Semantic search results retrieved successfully',
      {
        entries: [{ id: 'entry-1' }, { id: 'entry-2' }],
        correlationId: 'corr-123',
      },
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
  });

  it('should call the endpoint without a filter when no contentTypeIds are given', async () => {
    mockSemanticSearchGet.mockResolvedValue(semanticResult(['entry-1']));

    const tool = semanticSearchTool(mockConfig);
    await tool({ ...mockArgs, query: 'something' });

    expect(mockSemanticSearchGet).toHaveBeenCalledWith(
      { spaceId: 'test-space-id', environmentId: 'test-environment' },
      { query: 'something' },
    );
  });

  it('should build a filter with entityType Entry when contentTypeIds are given', async () => {
    mockSemanticSearchGet.mockResolvedValue(semanticResult(['entry-1']));

    const tool = semanticSearchTool(mockConfig);
    await tool({
      ...mockArgs,
      query: 'something',
      contentTypeIds: ['blogPost', 'author'],
    });

    expect(mockSemanticSearchGet).toHaveBeenCalledWith(
      { spaceId: 'test-space-id', environmentId: 'test-environment' },
      {
        query: 'something',
        filter: { entityType: 'Entry', contentTypeIds: ['blogPost', 'author'] },
      },
    );
  });

  it('should reject an empty contentTypeIds array at the schema layer', () => {
    const result = SemanticSearchToolParams.safeParse({
      ...mockArgs,
      query: 'something',
      contentTypeIds: [],
    });

    expect(result.success).toBe(false);
  });

  it('should tolerate a missing correlationId', async () => {
    mockSemanticSearchGet.mockResolvedValue(semanticResult(['entry-1']));

    const tool = semanticSearchTool(mockConfig);
    const result = await tool({ ...mockArgs, query: 'something' });

    const expectedResponse = formatResponse(
      'Semantic search results retrieved successfully',
      {
        entries: [{ id: 'entry-1' }],
      },
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
  });

  it('should surface CMA errors via the standard error handler', async () => {
    mockSemanticSearchGet.mockRejectedValue(
      new Error('Semantic search is not enabled for this environment'),
    );

    const tool = semanticSearchTool(mockConfig);
    const result = await tool({ ...mockArgs, query: 'something' });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error performing semantic search: Semantic search is not enabled for this environment',
        },
      ],
    });
  });
});
