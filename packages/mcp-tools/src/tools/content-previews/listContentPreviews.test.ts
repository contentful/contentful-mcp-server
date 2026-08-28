import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listContentPreviewsTool } from './listContentPreviews.js';
import { formatResponse } from '../../utils/formatters.js';
import { createClientConfig } from '../../utils/tools.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';
import {
  mockBlogPostPreview,
  mockLegacyPreview,
  previewCollection,
} from './mockClient.js';

const { mockRawGet, mockCreateClient } = vi.hoisted(() => {
  const mockRawGet = vi.fn();
  const mockCreateClient = vi.fn(() => ({ raw: { get: mockRawGet } }));
  return { mockRawGet, mockCreateClient };
});

vi.mock('contentful-management', () => ({
  default: { createClient: mockCreateClient },
  createClient: mockCreateClient,
}));

describe('listContentPreviews', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    mockRawGet.mockReset();
  });

  it('lists content previews for a space', async () => {
    mockRawGet.mockResolvedValue(
      previewCollection([mockBlogPostPreview, mockLegacyPreview]),
    );

    const tool = listContentPreviewsTool(mockConfig);
    const result = await tool({ spaceId: 'test-space-id' });

    expect(mockCreateClient).toHaveBeenCalledWith(
      createClientConfig(mockConfig),
    );
    expect(mockRawGet).toHaveBeenCalledWith(
      '/spaces/test-space-id/preview_environments',
      { params: { limit: 100 } },
    );

    const expected = formatResponse('Content previews retrieved successfully', {
      contentPreviews: [
        {
          id: 'preview-1',
          name: 'Blog Preview',
          description: 'Preview blog posts',
          configurations: [
            {
              contentTypeId: 'blogPost',
              entityType: 'ContentType',
              urlTemplate:
                'https://example.com/{locale}/blog/{entry.fields.slug}?secret=shhh',
              enabled: true,
            },
            {
              contentTypeId: 'landingPage',
              entityType: 'ContentType',
              urlTemplate:
                'https://example.com/{locale}/page/{entry.fields.slug}',
              enabled: false,
            },
          ],
        },
        {
          id: 'preview-2',
          name: 'Legacy Preview',
          description: null,
          configurations: [
            {
              contentTypeId: 'blogPost',
              entityType: 'ContentType',
              urlTemplate: 'https://legacy.example.com/{entry_id}',
              enabled: true,
            },
          ],
        },
      ],
      total: 2,
    });

    expect(result).toEqual({
      content: [{ type: 'text', text: expected }],
    });
  });

  it('filters to previews with an enabled configuration for a content type', async () => {
    mockRawGet.mockResolvedValue(
      previewCollection([mockBlogPostPreview, mockLegacyPreview]),
    );

    const tool = listContentPreviewsTool(mockConfig);
    const result = await tool({
      spaceId: 'test-space-id',
      contentTypeId: 'landingPage',
    });

    // `landingPage` is configured on preview-1 but disabled, so nothing matches.
    const expected = formatResponse('Content previews retrieved successfully', {
      contentPreviews: [],
      total: 2,
    });
    expect(result).toEqual({ content: [{ type: 'text', text: expected }] });
  });

  it('passes pagination params through', async () => {
    mockRawGet.mockResolvedValue(previewCollection([]));

    const tool = listContentPreviewsTool(mockConfig);
    await tool({ spaceId: 'test-space-id', limit: 5, skip: 10 });

    expect(mockRawGet).toHaveBeenCalledWith(
      '/spaces/test-space-id/preview_environments',
      { params: { limit: 5, skip: 10 } },
    );
  });

  it('reports errors from the CMA', async () => {
    mockRawGet.mockRejectedValue(new Error('Unauthorized'));

    const tool = listContentPreviewsTool(mockConfig);
    const result = await tool({ spaceId: 'test-space-id' });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error listing content previews: Unauthorized',
        },
      ],
    });
  });
});
