import { describe, it, expect, vi } from 'vitest';
import {
  addLocale,
  countIncomingLinkHops,
  resolvePreviewUrl,
  type PreviewEntryContext,
} from './previewUrl.js';

const entry: PreviewEntryContext = {
  sys: {
    id: 'entry-1',
    type: 'Entry',
    contentType: {
      sys: { id: 'blogPost', type: 'Link', linkType: 'ContentType' },
    },
  },
  fields: {
    slug: { 'en-US': 'hello-world', 'de-DE': 'hallo-welt' },
    order: { 'en-US': 7 },
    author: {
      'en-US': { sys: { id: 'author-1', type: 'Link', linkType: 'Entry' } },
    },
    hero: {
      'en-US': { sys: { id: 'asset-1', type: 'Link', linkType: 'Asset' } },
    },
  },
};

const base = {
  entry,
  environmentId: 'master',
  defaultLocaleCode: 'en-US',
};

describe('addLocale', () => {
  it('leaves paths without a field segment untouched', () => {
    expect(addLocale('entry.sys.id', 'en-US')).toBe('entry.sys.id');
    expect(addLocale('env_id', 'en-US')).toBe('env_id');
  });

  it('leaves a bare field path untouched so it can be unwrapped later', () => {
    expect(addLocale('entry.fields.slug', 'en-US')).toBe('entry.fields.slug');
  });

  it('inserts the locale between the field name and the rest of the path', () => {
    expect(addLocale('entry.fields.author.sys.id', 'en-US')).toBe(
      'entry.fields.author.en-US.sys.id',
    );
  });
});

describe('countIncomingLinkHops', () => {
  it('returns 0 when no linkedBy token is present', () => {
    expect(countIncomingLinkHops('https://x.com/{entry.sys.id}')).toBe(0);
    expect(countIncomingLinkHops('https://x.com/static')).toBe(0);
  });

  it('returns the deepest linkedBy chain in the template', () => {
    expect(
      countIncomingLinkHops(
        'https://x.com/{entry.linkedBy.linkedBy.fields.slug}/{entry.linkedBy.sys.id}',
      ),
    ).toBe(2);
  });
});

describe('resolvePreviewUrl', () => {
  it('substitutes locale, env, and localized field tokens', async () => {
    const { url, unresolvedTokens } = await resolvePreviewUrl({
      ...base,
      template:
        'https://example.com/{locale}/{env_id}/blog/{entry.fields.slug}?id={entry.sys.id}&secret=shhh',
    });

    expect(url).toBe(
      'https://example.com/en-US/master/blog/hello-world?id=entry-1&secret=shhh',
    );
    expect(unresolvedTokens).toEqual([]);
  });

  it('uses the requested locale for {locale} but the default locale for field values', async () => {
    const { url } = await resolvePreviewUrl({
      ...base,
      currentLocaleCode: 'de-DE',
      template: 'https://example.com/{locale}/{entry.fields.slug}',
    });

    expect(url).toBe('https://example.com/de-DE/hello-world');
  });

  it('supports the legacy entry_id and entry_field tokens', async () => {
    const { url, unresolvedTokens } = await resolvePreviewUrl({
      ...base,
      template: 'https://example.com/{entry_id}/{entry_field.slug}',
    });

    expect(url).toBe('https://example.com/entry-1/hello-world');
    expect(unresolvedTokens).toEqual([]);
  });

  it('stringifies non-string scalar field values', async () => {
    const { url } = await resolvePreviewUrl({
      ...base,
      template: 'https://example.com/{entry.fields.order}',
    });

    expect(url).toBe('https://example.com/7');
  });

  it('resolves one hop into a referenced entry', async () => {
    const getEntry = vi.fn().mockResolvedValue({
      sys: { id: 'author-1' },
      fields: { name: { 'en-US': 'Ada' } },
    });

    const { url, unresolvedTokens } = await resolvePreviewUrl({
      ...base,
      template: 'https://example.com/{entry.fields.author.fields.name}',
      getEntry,
    });

    expect(getEntry).toHaveBeenCalledWith('author-1');
    expect(url).toBe('https://example.com/Ada');
    expect(unresolvedTokens).toEqual([]);
  });

  it('reads sys off an asset link without fetching an entry', async () => {
    const getEntry = vi.fn();

    const { url, unresolvedTokens } = await resolvePreviewUrl({
      ...base,
      template: 'https://example.com/{entry.fields.hero.sys.id}',
      getEntry,
    });

    expect(getEntry).not.toHaveBeenCalled();
    expect(url).toBe('https://example.com/asset-1');
    expect(unresolvedTokens).toEqual([]);
  });

  it('cannot read fields off an asset link', async () => {
    const getEntry = vi.fn();

    const { url, unresolvedTokens } = await resolvePreviewUrl({
      ...base,
      template: 'https://example.com/{entry.fields.hero.fields.title}',
      getEntry,
    });

    expect(getEntry).not.toHaveBeenCalled();
    expect(url).toBe('https://example.com/{entry.fields.hero.fields.title}');
    expect(unresolvedTokens).toEqual(['entry.fields.hero.fields.title']);
  });

  it('walks incoming links for linkedBy tokens', async () => {
    const getIncomingLink = vi
      .fn()
      .mockResolvedValueOnce({
        sys: { id: 'page-1' },
        fields: { slug: { 'en-US': 'parent-page' } },
      })
      .mockResolvedValueOnce({
        sys: { id: 'site-1' },
        fields: { slug: { 'en-US': 'root' } },
      });

    const { url, unresolvedTokens } = await resolvePreviewUrl({
      ...base,
      template:
        'https://example.com/{entry.linkedBy.linkedBy.fields.slug}/{entry.linkedBy.fields.slug}/{entry.fields.slug}',
      getIncomingLink,
    });

    expect(getIncomingLink).toHaveBeenNthCalledWith(1, 'entry-1');
    expect(getIncomingLink).toHaveBeenNthCalledWith(2, 'page-1');
    expect(url).toBe('https://example.com/root/parent-page/hello-world');
    expect(unresolvedTokens).toEqual([]);
  });

  it('reports tokens it cannot resolve and leaves them in the URL', async () => {
    const { url, unresolvedTokens } = await resolvePreviewUrl({
      ...base,
      template:
        'https://example.com/{entry.fields.slug}?release={release.sys.id}&missing={entry.fields.nope}',
    });

    expect(url).toBe(
      'https://example.com/hello-world?release={release.sys.id}&missing={entry.fields.nope}',
    );
    expect(unresolvedTokens).toEqual(['release.sys.id', 'entry.fields.nope']);
  });

  it('does not resolve a field value that is not a scalar', async () => {
    const { unresolvedTokens } = await resolvePreviewUrl({
      ...base,
      template: 'https://example.com/{entry.fields.author}',
    });

    expect(unresolvedTokens).toEqual(['entry.fields.author']);
  });

  it('treats replacement values literally', async () => {
    const { url } = await resolvePreviewUrl({
      ...base,
      entry: {
        ...entry,
        fields: { slug: { 'en-US': 'a$&b' } },
      },
      template: 'https://example.com/{entry.fields.slug}',
    });

    expect(url).toBe('https://example.com/a$&b');
  });

  it('does not mutate the entry it was given', async () => {
    const original = structuredClone(entry);

    await resolvePreviewUrl({
      ...base,
      template: 'https://example.com/{entry.linkedBy.fields.slug}',
      getIncomingLink: vi
        .fn()
        .mockResolvedValue({ sys: { id: 'page-1' }, fields: {} }),
    });

    expect(entry).toEqual(original);
  });
});
