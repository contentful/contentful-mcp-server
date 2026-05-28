/**
 * Normalizes array-valued query parameters into comma-separated strings so the
 * Contentful Management API receives `?key=a,b,c` instead of `?key[0]=a&key[1]=b`.
 *
 * The CMA SDK passes params through to qs.stringify with its default
 * `arrayFormat: 'indices'`, which the API rejects with HTTP 400 for filter
 * operators like `[in]`, `[nin]`, `[all]`, and `[match]`. Mirrors the behavior
 * of `normalizeSearchParameters` in contentful.js.
 */
export function normalizeArrayFilters<T extends Record<string, unknown>>(
  query: T,
): T {
  const normalized: Record<string, unknown> = {};
  let didConvert = false;

  for (const key of Object.keys(query)) {
    const value = query[key];
    if (Array.isArray(value)) {
      normalized[key] = value.join(',');
      didConvert = true;
    }
  }

  return didConvert ? { ...query, ...normalized } : query;
}
