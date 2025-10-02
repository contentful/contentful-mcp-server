import { describe, it, expect } from 'vitest';

describe('Package Exports', () => {
  it('should export all tool collections', async () => {
    const moduleExports = await import('./index.js');

    const {
      aiActionTools,
      assetTools,
      contentTypeTools,
      contextTools,
      entryTools,
      environmentTools,
      jobTools,
      localeTools,
      orgTools,
      spaceTools,
      tagTools,
      taxonomyTools,
    } = moduleExports;

    expect(aiActionTools).toBeDefined();
    expect(typeof aiActionTools).toBe('object');

    expect(assetTools).toBeDefined();
    expect(typeof assetTools).toBe('object');

    expect(contentTypeTools).toBeDefined();
    expect(typeof contentTypeTools).toBe('object');

    expect(contextTools).toBeDefined();
    expect(typeof contextTools).toBe('object');

    expect(entryTools).toBeDefined();
    expect(typeof entryTools).toBe('object');

    expect(environmentTools).toBeDefined();
    expect(typeof environmentTools).toBe('object');

    expect(jobTools).toBeDefined();
    expect(typeof jobTools).toBe('object');

    expect(localeTools).toBeDefined();
    expect(typeof localeTools).toBe('object');

    expect(orgTools).toBeDefined();
    expect(typeof orgTools).toBe('object');

    expect(spaceTools).toBeDefined();
    expect(typeof spaceTools).toBe('object');

    expect(tagTools).toBeDefined();
    expect(typeof tagTools).toBe('object');

    expect(taxonomyTools).toBeDefined();
    expect(typeof taxonomyTools).toBe('object');
  });

  it('should export exactly 12 tool collections', async () => {
    const moduleExports = await import('./index.js');
    const exportedKeys = Object.keys(moduleExports);

    expect(exportedKeys).toHaveLength(12);
  });
});
