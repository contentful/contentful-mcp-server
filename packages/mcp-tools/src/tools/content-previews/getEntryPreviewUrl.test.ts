import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getEntryPreviewUrlTool } from './getEntryPreviewUrl.js';
import { formatResponse } from '../../utils/formatters.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';
import {
  mockArgs,
  mockBlogPostPreview,
  mockEntry,
  mockEntryGet,
  mockEntryGetMany,
  mockLegacyPreview,
  mockLocaleGetMany,
  mockLocales,
  mockRawGet,
  previewCollection,
  setupMockClient,
} from './mockClient.js';

vi.mock('../../utils/tools.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../utils/tools.js')>();
  return { ...orig, createToolClient: vi.fn() };
});

describe('getEntryPreviewUrl', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    mockEntryGet.mockReset();
    mockEntryGetMany.mockReset();
    mockLocaleGetMany.mockReset();
    mockRawGet.mockReset();
    setupMockClient();

    mockEntryGet.mockResolvedValue(mockEntry);
    mockLocaleGetMany.mockResolvedValue(mockLocales);
    mockRawGet.mockResolvedValue(previewCollection([mockBlogPostPreview]));
  });

  it('resolves the preview URL for an entry', async () => {
    const tool = getEntryPreviewUrlTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockEntryGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      entryId: mockArgs.entryId,
    });
    expect(mockRawGet).toHaveBeenCalledWith(
      '/spaces/test-space-id/preview_environments',
      { params: { limit: 100 } },
    );

    const expected = formatResponse('Entry preview URL resolved successfully', {
      previewUrl: 'https://example.com/en-US/blog/hello-world?secret=shhh',
      previewId: 'preview-1',
      previewName: 'Blog Preview',
      contentTypeId: 'blogPost',
      urlTemplate:
        'https://example.com/{locale}/blog/{entry.fields.slug}?secret=shhh',
      locale: 'en-US',
    });

    expect(result).toEqual({ content: [{ type: 'text', text: expected }] });
  });

  it('honours the requested locale', async () => {
    const tool = getEntryPreviewUrlTool(mockConfig);
    const result = await tool({ ...mockArgs, locale: 'de-DE' });

    expect(result.content[0].text).toContain(
      'https://example.com/de-DE/blog/hello-world?secret=shhh',
    );
  });

  it('selects the requested preview when several match', async () => {
    mockRawGet.mockResolvedValue(
      previewCollection([mockBlogPostPreview, mockLegacyPreview]),
    );

    const tool = getEntryPreviewUrlTool(mockConfig);
    const result = await tool({ ...mockArgs, previewId: 'preview-2' });

    expect(result.content[0].text).toContain(
      'https://legacy.example.com/test-entry-id',
    );
    expect(result.content[0].text).toContain('Legacy Preview');
  });

  it('matches configurations that only carry the deprecated contentType field', async () => {
    mockRawGet.mockResolvedValue(previewCollection([mockLegacyPreview]));

    const tool = getEntryPreviewUrlTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain(
      'https://legacy.example.com/test-entry-id',
    );
  });

  it('reports unresolved tokens with a warning', async () => {
    mockRawGet.mockResolvedValue(
      previewCollection([
        {
          ...mockBlogPostPreview,
          configurations: [
            {
              url: 'https://example.com/{entry.fields.missing}',
              entityType: 'ContentType',
              entityId: 'blogPost',
              enabled: true,
            },
          ],
        },
      ]),
    );

    const tool = getEntryPreviewUrlTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result.content[0].text).toContain('entry.fields.missing');
    expect(result.content[0].text).toContain('Verify the link before sharing');
  });

  it('errors when no preview is configured for the content type', async () => {
    mockRawGet.mockResolvedValue(previewCollection([]));

    const tool = getEntryPreviewUrlTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain(
      'No content preview with an enabled configuration for content type "blogPost"',
    );
  });

  it('errors when the requested preview does not cover the content type', async () => {
    const tool = getEntryPreviewUrlTool(mockConfig);
    const result = await tool({ ...mockArgs, previewId: 'does-not-exist' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain(
      'Content preview "does-not-exist" has no enabled configuration',
    );
    expect(result.content[0].text).toContain('Blog Preview (preview-1)');
  });

  it('errors when the entry has no content type', async () => {
    mockEntryGet.mockResolvedValue({
      sys: { id: 'test-entry-id', type: 'Entry' },
      fields: {},
    });

    const tool = getEntryPreviewUrlTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('has no content type');
  });

  it('errors when the environment has no locales', async () => {
    mockLocaleGetMany.mockResolvedValue({ items: [] });

    const tool = getEntryPreviewUrlTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('No locales found');
  });

  it('resolves linkedBy tokens through incoming links', async () => {
    mockRawGet.mockResolvedValue(
      previewCollection([
        {
          ...mockBlogPostPreview,
          configurations: [
            {
              url: 'https://example.com/{entry.linkedBy.fields.slug}/{entry.fields.slug}',
              entityType: 'ContentType',
              entityId: 'blogPost',
              enabled: true,
            },
          ],
        },
      ]),
    );
    mockEntryGetMany.mockResolvedValue({
      items: [{ sys: { id: 'page-1' }, fields: { slug: { 'en-US': 'blog' } } }],
    });

    const tool = getEntryPreviewUrlTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockEntryGetMany).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      query: { links_to_entry: 'test-entry-id', limit: 1 },
    });
    expect(result.content[0].text).toContain(
      'https://example.com/blog/hello-world',
    );
  });
});
