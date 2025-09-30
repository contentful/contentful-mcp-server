import { describe, it, expect } from 'vitest';

// Test that registration function exports are available
describe('Package Exports', () => {
  it('should export main registration function', async () => {
    const { registerAllTools } = await import('./index.js');

    expect(registerAllTools).toBeDefined();
    expect(typeof registerAllTools).toBe('function');
  });

  it('should export category-specific registration functions', async () => {
    const {
      registerAssetTools,
      registerEntriesTools,
      registerContentTypesTools,
      registerEnvironmentTools,
      registerSpaceTools,
      registerTagsTools,
      registerAiActionsTools,
      registerLocaleTools,
      registerOrgTools,
      registerContextTools,
      registerJobs,
      registerTaxonomyTools,
    } = await import('./index.js');

    expect(registerAssetTools).toBeDefined();
    expect(registerEntriesTools).toBeDefined();
    expect(registerContentTypesTools).toBeDefined();
    expect(registerEnvironmentTools).toBeDefined();
    expect(registerSpaceTools).toBeDefined();
    expect(registerTagsTools).toBeDefined();
    expect(registerAiActionsTools).toBeDefined();
    expect(registerLocaleTools).toBeDefined();
    expect(registerOrgTools).toBeDefined();
    expect(registerContextTools).toBeDefined();
    expect(registerJobs).toBeDefined();
    expect(registerTaxonomyTools).toBeDefined();

    // Verify they are all functions
    expect(typeof registerAssetTools).toBe('function');
    expect(typeof registerEntriesTools).toBe('function');
    expect(typeof registerContentTypesTools).toBe('function');
  });
});
