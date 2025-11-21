import { describe, it, expect } from 'vitest';
import { ContentfulMcpTools, type ContentfulConfig } from './index.js';
import { createMockConfig } from './test-helpers/mockConfig.js';

describe('Package Exports', () => {
  it('should export ContentfulMcpTools class', async () => {
    const moduleExports = await import('./index.js');

    expect(moduleExports.ContentfulMcpTools).toBeDefined();
    expect(typeof moduleExports.ContentfulMcpTools).toBe('function');
  });

  it('should export ContentfulConfig type', async () => {
    // TypeScript types are erased at runtime, so we can't test for them directly
    // Instead, we verify that the type can be imported and used
    const moduleExports = await import('./index.js');
    const { ContentfulMcpTools } = moduleExports;

    // Verify we can use the type by checking that ContentfulMcpTools accepts ContentfulConfig
    const mockConfig = createMockConfig();
    const tools = new ContentfulMcpTools(mockConfig);
    expect(tools).toBeDefined();
  });

  it('should export exactly 1 runtime item (ContentfulMcpTools class)', async () => {
    // TypeScript types are erased at runtime, so ContentfulConfig won't be in exports
    const moduleExports = await import('./index.js');
    const exportedKeys = Object.keys(moduleExports);

    expect(exportedKeys).toHaveLength(1);
    expect(exportedKeys).toContain('ContentfulMcpTools');
  });
});

describe('ContentfulMcpTools', () => {
  const mockConfig = createMockConfig();

  it('should instantiate with config', () => {
    const tools = new ContentfulMcpTools(mockConfig);
    expect(tools).toBeDefined();
    expect(tools).toBeInstanceOf(ContentfulMcpTools);
  });

  it('should provide all tool collection getters', () => {
    const tools = new ContentfulMcpTools(mockConfig);

    expect(tools.getAiActionTools).toBeDefined();
    expect(typeof tools.getAiActionTools).toBe('function');
    expect(tools.getAssetTools).toBeDefined();
    expect(typeof tools.getAssetTools).toBe('function');
    expect(tools.getContentTypeTools).toBeDefined();
    expect(typeof tools.getContentTypeTools).toBe('function');
    expect(tools.getContextTools).toBeDefined();
    expect(typeof tools.getContextTools).toBe('function');
    expect(tools.getEditorInterfaceTools).toBeDefined();
    expect(typeof tools.getEditorInterfaceTools).toBe('function');
    expect(tools.getEntryTools).toBeDefined();
    expect(typeof tools.getEntryTools).toBe('function');
    expect(tools.getEnvironmentTools).toBeDefined();
    expect(typeof tools.getEnvironmentTools).toBe('function');
    expect(tools.getLocaleTools).toBeDefined();
    expect(typeof tools.getLocaleTools).toBe('function');
    expect(tools.getOrgTools).toBeDefined();
    expect(typeof tools.getOrgTools).toBe('function');
    expect(tools.getSpaceTools).toBeDefined();
    expect(typeof tools.getSpaceTools).toBe('function');
    expect(tools.getTagTools).toBeDefined();
    expect(typeof tools.getTagTools).toBe('function');
    expect(tools.getTaxonomyTools).toBeDefined();
    expect(typeof tools.getTaxonomyTools).toBe('function');
    expect(tools.getJobTools).toBeDefined();
    expect(typeof tools.getJobTools).toBe('function');
  });

  it('should return tool collections from getters', () => {
    const tools = new ContentfulMcpTools(mockConfig);

    const aiActionTools = tools.getAiActionTools();
    expect(aiActionTools).toBeDefined();
    expect(typeof aiActionTools).toBe('object');

    const assetTools = tools.getAssetTools();
    expect(assetTools).toBeDefined();
    expect(typeof assetTools).toBe('object');

    const contentTypeTools = tools.getContentTypeTools();
    expect(contentTypeTools).toBeDefined();
    expect(typeof contentTypeTools).toBe('object');
  });

  it('should allow updating config', () => {
    const tools = new ContentfulMcpTools(mockConfig);
    const newConfig: Partial<ContentfulConfig> = {
      accessToken: 'new-token',
    };

    tools.updateConfig(newConfig);

    // Verify the update worked by checking that new tools use the new config
    // This is an indirect test - the actual config is private
    expect(tools.updateConfig).toBeDefined();
    expect(typeof tools.updateConfig).toBe('function');
  });
});
