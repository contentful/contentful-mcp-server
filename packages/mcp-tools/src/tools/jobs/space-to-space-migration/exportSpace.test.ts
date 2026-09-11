import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createExportSpaceTool } from './exportSpace.js';
import { formatResponse } from '../../../utils/formatters.js';
import { mockExportResult, createExportTestArgs } from './mockClient.js';

// Mock contentful-export at the top level using vi.hoisted
const mockContentfulExport = vi.hoisted(() => vi.fn());
const mockJoin = vi.hoisted(() => vi.fn((...args) => args.join('/')));

// Mock the entire exportSpace module to replace contentful-export
vi.mock('contentful-export', () => ({
  default: mockContentfulExport,
}));

// Mock the require function and module resolution
vi.mock('module', () => ({
  createRequire: vi.fn(() => vi.fn(() => mockContentfulExport)),
}));

// Mock path module
vi.mock('path', () => ({
  join: mockJoin,
}));

import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('exportSpace', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock to return successful result by default
    mockContentfulExport.mockResolvedValue(mockExportResult);
  });

  it('should export space with minimal options', async () => {
    const testArgs = createExportTestArgs();

    const tool = createExportSpaceTool(mockConfig);
    const result = await tool(testArgs);

    expect(mockContentfulExport).toHaveBeenCalledWith({
      ...testArgs,
      managementToken: mockConfig.accessToken,
      host: 'api.contentful.com',
      environmentId: 'test-environment',
      exportDir: process.cwd(),
      contentFile: 'contentful-export-test-space-id.json',
    });

    const expectedResponse = formatResponse('Space exported successfully', {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      exportPath: `${process.cwd()}/contentful-export-test-space-id.json`,
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
    const testArgs = createExportTestArgs({
      // File and directory options
      exportDir: '/custom/export/dir',
      contentFile: 'custom-export.json',
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
      queryEntries: {
        content_type: 'blogPost',
        'fields.published': true,
        limit: 50,
      },
      queryAssets: {
        mimetype_group: 'image',
        order: 'sys.createdAt',
      },

      // Asset and performance options
      downloadAssets: true,
      maxAllowedLimit: 500,

      // Logging and debugging
      errorLogFile: '/logs/export.log',
      useVerboseRenderer: true,
    });

    const configWithDelivery = createMockConfig({
      deliveryToken: 'cfg-delivery-token',
      hostDelivery: 'cdn.eu.contentful.com',
    });

    const tool = createExportSpaceTool(configWithDelivery);
    const result = await tool(testArgs);

    expect(mockContentfulExport).toHaveBeenCalledWith({
      ...testArgs,
      managementToken: configWithDelivery.accessToken,
      host: 'api.contentful.com',
      deliveryToken: 'cfg-delivery-token',
      hostDelivery: 'cdn.eu.contentful.com',
    });

    expect(result.content[0].text).toContain('Space exported successfully');
    expect(result.content[0].text).toContain(
      '/custom/export/dir/custom-export.json',
    );
  });

  it('forwards only safe export options and server-configured endpoints', async () => {
    const configWithAll = createMockConfig({
      host: 'api.example.com',
      deliveryToken: 'configured-delivery-token',
      hostDelivery: 'cdn.example.com',
    });
    const tool = createExportSpaceTool(configWithAll);

    await tool(
      createExportTestArgs({
        host: 'untrusted.example',
        proxy: 'http://untrusted.example:8080',
        rawProxy: true,
        headers: { Authorization: 'Bearer untrusted' },
        config: '/tmp/untrusted-export.json',
        deliveryToken: 'untrusted-delivery-token',
        hostDelivery: 'untrusted-cdn.example',
        managementToken: 'untrusted-management-token',
      }),
    );

    const forwarded = mockContentfulExport.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(forwarded).toMatchObject({
      managementToken: configWithAll.accessToken,
      host: configWithAll.host,
      deliveryToken: configWithAll.deliveryToken,
      hostDelivery: configWithAll.hostDelivery,
    });
    for (const key of ['proxy', 'rawProxy', 'headers', 'config']) {
      expect(forwarded).not.toHaveProperty(key);
    }
  });

  it('should handle contentful-export errors', async () => {
    const error = new Error('Space not found');
    mockContentfulExport.mockRejectedValue(error);

    const testArgs = createExportTestArgs({
      spaceId: 'invalid-space-id',
    });

    const tool = createExportSpaceTool(mockConfig);
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
