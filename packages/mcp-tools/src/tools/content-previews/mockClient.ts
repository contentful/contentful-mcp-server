import { vi } from 'vitest';
import { createToolClient } from '../../utils/tools.js';
import type { PreviewEnvironment } from './types.js';

/** Shared mocks for content preview tool tests. */
export const mockRawGet = vi.fn();
export const mockEntryGet = vi.fn();
export const mockEntryGetMany = vi.fn();
export const mockLocaleGetMany = vi.fn();

export const mockClient = {
  raw: { get: mockRawGet },
  entry: { get: mockEntryGet, getMany: mockEntryGetMany },
  locale: { getMany: mockLocaleGetMany },
};

export function setupMockClient() {
  vi.mocked(createToolClient).mockReturnValue(
    mockClient as unknown as ReturnType<typeof createToolClient>,
  );
}

export const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  entryId: 'test-entry-id',
};

export const mockEntry = {
  sys: {
    id: 'test-entry-id',
    type: 'Entry' as const,
    version: 3,
    contentType: {
      sys: {
        id: 'blogPost',
        type: 'Link' as const,
        linkType: 'ContentType' as const,
      },
    },
  },
  fields: {
    slug: { 'en-US': 'hello-world' },
  },
};

export const mockLocales = {
  items: [
    { code: 'en-US', default: true },
    { code: 'de-DE', default: false },
  ],
};

export const mockBlogPostPreview: PreviewEnvironment = {
  sys: {
    id: 'preview-1',
    type: 'PreviewEnvironment',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    space: { sys: { id: 'test-space-id', type: 'Link', linkType: 'Space' } },
  },
  name: 'Blog Preview',
  description: 'Preview blog posts',
  configurations: [
    {
      url: 'https://example.com/{locale}/blog/{entry.fields.slug}?secret=shhh',
      entityType: 'ContentType',
      entityId: 'blogPost',
      contentType: 'blogPost',
      enabled: true,
      example: false,
    },
    {
      url: 'https://example.com/{locale}/page/{entry.fields.slug}',
      entityType: 'ContentType',
      entityId: 'landingPage',
      contentType: 'landingPage',
      enabled: false,
      example: false,
    },
  ],
};

export const mockLegacyPreview: PreviewEnvironment = {
  sys: {
    id: 'preview-2',
    type: 'PreviewEnvironment',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    space: { sys: { id: 'test-space-id', type: 'Link', linkType: 'Space' } },
  },
  name: 'Legacy Preview',
  configurations: [
    {
      url: 'https://legacy.example.com/{entry_id}',
      contentType: 'blogPost',
      enabled: true,
    },
  ],
};

export function previewCollection(items: PreviewEnvironment[]) {
  return {
    sys: { type: 'Array' as const },
    total: items.length,
    limit: 100,
    skip: 0,
    items,
  };
}
