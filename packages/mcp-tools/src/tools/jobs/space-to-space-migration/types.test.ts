import { describe, it, expect } from 'vitest';
import { ExportParamsSchema, ImportParamsSchema } from './types.js';

describe('ExportParamsSchema queryEntries/queryAssets', () => {
  it('preserves known query fields on queryEntries and queryAssets', () => {
    const parsed = ExportParamsSchema.parse({
      spaceId: 'source-space',
      environmentId: 'master',
      queryEntries: {
        content_type: 'blogPost',
        include: 2,
        select: 'fields.title',
        links_to_entry: 'linked-entry-id',
        limit: 50,
        skip: 10,
        order: 'sys.createdAt',
      },
      queryAssets: {
        mimetype_group: 'image',
        select: 'fields.file',
        limit: 25,
        skip: 5,
        order: 'sys.createdAt',
      },
    });

    expect(parsed.queryEntries).toEqual({
      content_type: 'blogPost',
      include: 2,
      select: 'fields.title',
      links_to_entry: 'linked-entry-id',
      limit: 50,
      skip: 10,
      order: 'sys.createdAt',
    });
    expect(parsed.queryAssets).toEqual({
      mimetype_group: 'image',
      select: 'fields.file',
      limit: 25,
      skip: 5,
      order: 'sys.createdAt',
    });
  });

  it('preserves dynamic fields./sys./metadata. filter keys, which Contentful supports but cannot be statically enumerated', () => {
    const parsed = ExportParamsSchema.parse({
      spaceId: 'source-space',
      environmentId: 'master',
      queryEntries: {
        content_type: 'blogPost',
        'fields.published': true,
        'fields.tags[in]': 'featured,promo',
        'sys.id': 'entry-id',
      },
      queryAssets: {
        mimetype_group: 'image',
        'fields.file.contentType': 'image/png',
        'metadata.tags.sys.id[in]': 'tag-id',
      },
    });

    expect(parsed.queryEntries).toEqual({
      content_type: 'blogPost',
      'fields.published': true,
      'fields.tags[in]': 'featured,promo',
      'sys.id': 'entry-id',
    });
    expect(parsed.queryAssets).toEqual({
      mimetype_group: 'image',
      'fields.file.contentType': 'image/png',
      'metadata.tags.sys.id[in]': 'tag-id',
    });
  });

  it('strips unknown nested keys from queryEntries and queryAssets that are not dynamic filter keys', () => {
    const parsed = ExportParamsSchema.parse({
      spaceId: 'source-space',
      environmentId: 'master',
      queryEntries: {
        content_type: 'blogPost',
        'fields.published': true,
        $where: { $ne: null },
        arbitraryNestedKey: 'nested-injected-value',
      },
      queryAssets: {
        mimetype_group: 'image',
        maliciousKey: 'nested-injected-value',
      },
    });

    expect(parsed.queryEntries).toEqual({
      content_type: 'blogPost',
      'fields.published': true,
    });
    expect(parsed.queryAssets).toEqual({ mimetype_group: 'image' });
    expect(parsed.queryEntries).not.toHaveProperty('$where');
    expect(parsed.queryEntries).not.toHaveProperty('arbitraryNestedKey');
    expect(parsed.queryAssets).not.toHaveProperty('maliciousKey');
  });
});

describe('ImportParamsSchema', () => {
  it('preserves supported import fields', () => {
    const parsed = ImportParamsSchema.parse({
      spaceId: 'target-space',
      environmentId: 'master',
      contentModelOnly: true,
      uploadAssets: true,
      assetsDirectory: '/assets',
    });

    expect(parsed).toMatchObject({
      spaceId: 'target-space',
      environmentId: 'master',
      contentModelOnly: true,
      uploadAssets: true,
      assetsDirectory: '/assets',
    });
  });

  it('strips unknown top-level fields', () => {
    const parsed = ImportParamsSchema.parse({
      spaceId: 'target-space',
      environmentId: 'master',
      host: 'untrusted.example',
      managementToken: 'untrusted-management-token',
    });

    expect(parsed).not.toHaveProperty('host');
    expect(parsed).not.toHaveProperty('managementToken');
  });
});
