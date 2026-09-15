import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createExportSpaceTool } from './exportSpace.js';
import { ExportParamsSchema } from './types.js';
import { formatResponse } from '../../../utils/formatters.js';
import { mockExportResult, createExportTestArgs } from './mockClient.js';

// Mock contentful-export at the top level using vi.hoisted
const mockContentfulExport = vi.hoisted(() => vi.fn());
const mockDownloadAssetsSafely = vi.hoisted(() => vi.fn());
// Mock the entire exportSpace module to replace contentful-export
vi.mock('contentful-export', () => ({
  default: mockContentfulExport,
}));
vi.mock('./assetDownloads.js', () => ({
  downloadAssetsSafely: mockDownloadAssetsSafely,
}));

// Mock the require function and module resolution
vi.mock('module', () => ({
  createRequire: vi.fn(() => vi.fn(() => mockContentfulExport)),
}));

import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('exportSpace', () => {
  const mockConfig = createMockConfig();
  const artifact = {
    exportDir: '/tmp/contentful-mcp-export-safe',
    contentFile: 'safe.json',
    errorLogFile: '/tmp/contentful-mcp-export-safe/safe.error.json',
    exportPath: '/tmp/contentful-mcp-export-safe/safe.json',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock to return successful result by default
    mockContentfulExport.mockResolvedValue(mockExportResult);
    mockDownloadAssetsSafely.mockResolvedValue(undefined);
  });

  it('does not expose filesystem path controls to the caller', () => {
    expect(ExportParamsSchema.shape).not.toHaveProperty('exportDir');
    expect(ExportParamsSchema.shape).not.toHaveProperty('contentFile');
    expect(ExportParamsSchema.shape).not.toHaveProperty('errorLogFile');
  });

  it('ignores path values even when direct callers provide extra keys', async () => {
    const tool = createExportSpaceTool(mockConfig, async () => artifact);

    await tool({
      ...createExportTestArgs({ spaceId: '../../outside' }),
      exportDir: '/etc',
      contentFile: '../../outside.json',
      errorLogFile: '/var/log/outside.log',
    } as unknown as Parameters<typeof tool>[0]);

    const options = mockContentfulExport.mock.calls[0][0];
    expect(options.exportDir).toBe(artifact.exportDir);
    expect(options.contentFile).toBe(artifact.contentFile);
    expect(options.errorLogFile).toBe(artifact.errorLogFile);
    expect(options.exportDir).not.toBe('/etc');
    expect(options.contentFile).not.toContain('outside');
    expect(options.errorLogFile).not.toContain('/var/log');
  });

  it('should export space with minimal options', async () => {
    const testArgs = createExportTestArgs();

    const tool = createExportSpaceTool(mockConfig, async () => artifact);
    const result = await tool(testArgs);

    expect(mockContentfulExport).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      saveFile: testArgs.saveFile,
      includeDrafts: testArgs.includeDrafts,
      includeArchived: testArgs.includeArchived,
      skipContentModel: testArgs.skipContentModel,
      skipEditorInterfaces: testArgs.skipEditorInterfaces,
      skipContent: testArgs.skipContent,
      skipRoles: testArgs.skipRoles,
      skipTags: testArgs.skipTags,
      skipWebhooks: testArgs.skipWebhooks,
      stripTags: testArgs.stripTags,
      contentOnly: testArgs.contentOnly,
      downloadAssets: false,
      maxAllowedLimit: testArgs.maxAllowedLimit,
      useVerboseRenderer: testArgs.useVerboseRenderer,
      managementToken: mockConfig.accessToken,
      host: 'api.contentful.com',
      exportDir: artifact.exportDir,
      contentFile: artifact.contentFile,
      errorLogFile: artifact.errorLogFile,
    });

    const expectedResponse = formatResponse('Space exported successfully', {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      exportPath: artifact.exportPath,
      contentTypes: 1,
      entries: 1,
      assets: 1,
      locales: 1,
      tags: 1,
      webhooks: 0,
      roles: 0,
      editorInterfaces: 0,
    });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });
  });

  it('should export space with complex configuration options', async () => {
    const queryEntries = {
      content_type: 'blogPost',
      'fields.published': true,
      limit: 50,
    };
    const queryAssets = {
      mimetype_group: 'image',
      order: 'sys.createdAt',
    };
    const testArgs = createExportTestArgs({
      saveFile: true,

      // Content inclusion options
      includeDrafts: true,
      includeArchived: true,
      contentOnly: false,

      // Skip options
      skipContentModel: false,
      skipEditorInterfaces: true,
      skipContent: false,
      skipRoles: true,
      skipTags: false,
      skipWebhooks: true,
      stripTags: true,

      // Query options
      queryEntries,
      queryAssets,

      // Asset and performance options
      downloadAssets: true,
      maxAllowedLimit: 500,

      useVerboseRenderer: true,
    });

    const configWithDelivery = createMockConfig({
      deliveryToken: 'cfg-delivery-token',
      hostDelivery: 'cdn.eu.contentful.com',
    });

    const tool = createExportSpaceTool(
      configWithDelivery,
      async () => artifact,
    );
    const result = await tool(testArgs);

    expect(mockContentfulExport).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      saveFile: testArgs.saveFile,
      includeDrafts: testArgs.includeDrafts,
      includeArchived: testArgs.includeArchived,
      skipContentModel: testArgs.skipContentModel,
      skipEditorInterfaces: testArgs.skipEditorInterfaces,
      skipContent: testArgs.skipContent,
      skipRoles: testArgs.skipRoles,
      skipTags: testArgs.skipTags,
      skipWebhooks: testArgs.skipWebhooks,
      stripTags: testArgs.stripTags,
      contentOnly: testArgs.contentOnly,
      queryEntries,
      queryAssets,
      downloadAssets: false,
      maxAllowedLimit: testArgs.maxAllowedLimit,
      useVerboseRenderer: testArgs.useVerboseRenderer,
      managementToken: configWithDelivery.accessToken,
      host: 'api.contentful.com',
      deliveryToken: 'cfg-delivery-token',
      hostDelivery: 'cdn.eu.contentful.com',
      exportDir: artifact.exportDir,
      contentFile: artifact.contentFile,
      errorLogFile: artifact.errorLogFile,
    });

    expect(result.content[0].text).toContain('Space exported successfully');
    expect(result.content[0].text).toContain(artifact.exportPath);
  });

  it('should always use config host/deliveryToken/hostDelivery, never from args (GHSA-2xhg-73j7-rrgx)', async () => {
    const configWithAll = createMockConfig({
      host: 'eu.api.contentful.com',
      deliveryToken: 'cfg-cda-token',
      hostDelivery: 'cdn.eu.contentful.com',
    });
    const testArgs = createExportTestArgs();

    const tool = createExportSpaceTool(configWithAll, async () => artifact);
    await tool(testArgs);

    const calledWith = mockContentfulExport.mock.calls[0][0];
    expect(calledWith.host).toBe('eu.api.contentful.com');
    expect(calledWith.deliveryToken).toBe('cfg-cda-token');
    expect(calledWith.hostDelivery).toBe('cdn.eu.contentful.com');
    expect(calledWith.proxy).toBeUndefined();
    expect(calledWith.rawProxy).toBeUndefined();
  });

  it('keeps malicious space IDs out of generated file paths', async () => {
    const tool = createExportSpaceTool(mockConfig, async () => artifact);

    await tool(createExportTestArgs({ spaceId: '../../outside' }));

    const options = mockContentfulExport.mock.calls[0][0];
    expect(options.contentFile).toBe(artifact.contentFile);
    expect(options.errorLogFile).toBe(artifact.errorLogFile);
    expect(options.contentFile).not.toContain('outside');
    expect(options.errorLogFile).not.toContain('outside');
  });

  it('routes requested asset downloads through containment validation', async () => {
    const tool = createExportSpaceTool(mockConfig, async () => artifact);

    await tool(createExportTestArgs({ downloadAssets: true }));

    const options = mockContentfulExport.mock.calls[0][0];
    expect(options.downloadAssets).toBe(false);
    expect(options.exportDir).toBe(artifact.exportDir);
    expect(mockDownloadAssetsSafely).toHaveBeenCalledWith(
      options,
      mockExportResult.assets,
    );
  });

  it('returns a tool error when asset path containment fails', async () => {
    mockDownloadAssetsSafely.mockRejectedValue(
      new Error('Asset download path escapes the export directory'),
    );
    const tool = createExportSpaceTool(mockConfig, async () => artifact);

    const result = await tool(createExportTestArgs({ downloadAssets: true }));

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error exporting space: Failed to export space: Asset download path escapes the export directory',
        },
      ],
    });
  });

  it('prevents direct callers from overriding the generated error log path', async () => {
    const tool = createExportSpaceTool(mockConfig, async () => artifact);

    await tool({
      ...createExportTestArgs(),
      errorLogFile: '/var/log/outside.log',
    } as unknown as Parameters<typeof tool>[0]);

    const options = mockContentfulExport.mock.calls[0][0];
    expect(options.errorLogFile).toBe(artifact.errorLogFile);
    expect(options.errorLogFile).not.toContain('/var/log');
  });

  it('returns the generated artifact export path exactly', async () => {
    const tool = createExportSpaceTool(mockConfig, async () => artifact);

    const result = await tool(createExportTestArgs());

    const expectedResponse = formatResponse('Space exported successfully', {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      exportPath: artifact.exportPath,
      contentTypes: 1,
      entries: 1,
      assets: 1,
      locales: 1,
      tags: 1,
      webhooks: 0,
      roles: 0,
      editorInterfaces: 0,
    });

    expect(result.content[0].text).toBe(expectedResponse);
  });

  it('should handle contentful-export errors', async () => {
    const error = new Error('Space not found');
    mockContentfulExport.mockRejectedValue(error);

    const testArgs = createExportTestArgs({
      spaceId: 'invalid-space-id',
    });

    const tool = createExportSpaceTool(mockConfig, async () => artifact);
    const result = await tool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error exporting space: Failed to export space: Space not found',
        },
      ],
    });
  });
});
