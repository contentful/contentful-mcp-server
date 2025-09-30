import { describe, it, expect } from 'vitest';

describe('Package Exports', () => {
  it('should export individual tool handlers and schemas', async () => {
    const moduleExports = await import('./index.js');

    const {
      uploadAssetTool,
      UploadAssetToolParams,
      createEntryTool,
      CreateEntryToolParams,
      listContentTypesTool,
      ListContentTypesToolParams,
      getInitialContextTool,
    } = moduleExports;

    expect(typeof uploadAssetTool).toBe('function');
    expect(UploadAssetToolParams).toBeDefined();

    expect(typeof createEntryTool).toBe('function');
    expect(CreateEntryToolParams).toBeDefined();

    expect(typeof listContentTypesTool).toBe('function');
    expect(ListContentTypesToolParams).toBeDefined();

    expect(typeof getInitialContextTool).toBe('function');

    expect(moduleExports.registerAssetTools).toBeUndefined();
    expect(moduleExports.registerAllTools).toBeUndefined();
  });
});
