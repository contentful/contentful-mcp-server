import { describe, it, expect } from 'vitest';

describe('Package Exports', () => {
  it('should export individual tool handlers and schemas', async () => {
    const moduleExports = await import('./index.js');

    const {
      registerUploadAssetTool,
      UploadAssetToolParams,
      registerCreateEntryTool,
      CreateEntryToolParams,
      registerListContentTypesTool,
      ListContentTypesToolParams,
      registerGetInitialContextTool,
    } = moduleExports;

    expect(typeof registerUploadAssetTool).toBe('function');
    expect(UploadAssetToolParams).toBeDefined();

    expect(typeof registerCreateEntryTool).toBe('function');
    expect(CreateEntryToolParams).toBeDefined();

    expect(typeof registerListContentTypesTool).toBe('function');
    expect(ListContentTypesToolParams).toBeDefined();

    expect(typeof registerGetInitialContextTool).toBe('function');

    expect(moduleExports.registerAssetTools).toBeUndefined();
    expect(moduleExports.registerAllTools).toBeUndefined();
  });
});
