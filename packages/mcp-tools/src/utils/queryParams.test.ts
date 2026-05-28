import { describe, it, expect } from 'vitest';
import { normalizeArrayFilters } from './queryParams.js';

describe('normalizeArrayFilters', () => {
  it('joins array values into comma-separated strings', () => {
    const result = normalizeArrayFilters({
      'sys.id[in]': ['a', 'b', 'c'],
    });

    expect(result).toEqual({ 'sys.id[in]': 'a,b,c' });
  });

  it('leaves scalar values untouched', () => {
    const query = {
      content_type: 'article',
      limit: 10,
      skip: 0,
      'fields.title': 'hello',
    };

    expect(normalizeArrayFilters(query)).toEqual(query);
  });

  it('handles a mix of array and scalar values', () => {
    const result = normalizeArrayFilters({
      content_type: 'article',
      'sys.id[in]': ['a', 'b'],
      'metadata.tags.sys.id[in]': ['t1', 't2', 't3'],
      limit: 25,
    });

    expect(result).toEqual({
      content_type: 'article',
      'sys.id[in]': 'a,b',
      'metadata.tags.sys.id[in]': 't1,t2,t3',
      limit: 25,
    });
  });

  it('normalizes catchall array filters regardless of suffix', () => {
    const result = normalizeArrayFilters({
      'fields.tags[nin]': ['archived', 'draft'],
      'fields.categories[all]': ['news', 'tech'],
      'fields.title[match]': ['quick', 'brown'],
    });

    expect(result).toEqual({
      'fields.tags[nin]': 'archived,draft',
      'fields.categories[all]': 'news,tech',
      'fields.title[match]': 'quick,brown',
    });
  });

  it('coerces single-element arrays to plain strings', () => {
    const result = normalizeArrayFilters({
      'sys.id[in]': ['only-one'],
    });

    expect(result).toEqual({ 'sys.id[in]': 'only-one' });
  });

  it('returns the same reference when no arrays are present', () => {
    const query = { content_type: 'article', limit: 10 };

    expect(normalizeArrayFilters(query)).toBe(query);
  });

  it('does not mutate the input query', () => {
    const ids = ['a', 'b'];
    const query = { 'sys.id[in]': ids };

    normalizeArrayFilters(query);

    expect(query['sys.id[in]']).toBe(ids);
    expect(ids).toEqual(['a', 'b']);
  });

  it('handles empty arrays by emitting an empty string', () => {
    const result = normalizeArrayFilters({ 'sys.id[in]': [] });

    expect(result).toEqual({ 'sys.id[in]': '' });
  });
});
