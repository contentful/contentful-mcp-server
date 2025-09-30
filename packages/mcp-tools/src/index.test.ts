import { describe, it, expect } from 'vitest';

describe('Package Exports', () => {
  it('should export individual registration helpers', async () => {
    const moduleExports = await import('./index.js');

    const {
      registerUploadAssetTool,
      registerCreateEntryTool,
      registerListContentTypesTool,
      registerGetInitialContextTool,
    } = moduleExports;

    expect(typeof registerUploadAssetTool).toBe('function');

    expect(typeof registerCreateEntryTool).toBe('function');

    expect(typeof registerListContentTypesTool).toBe('function');

    expect(typeof registerGetInitialContextTool).toBe('function');

    expect(moduleExports.registerAssetTools).toBeUndefined();
    expect(moduleExports.registerAllTools).toBeUndefined();
  });
});
