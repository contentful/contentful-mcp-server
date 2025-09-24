import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createExportSpaceTool } from './exportSpace.js';
import { formatResponse } from '../../../utils/formatters.js';
import { mockExportResult, createExportTestArgs } from './mockClient.js';

// Mock contentful-export at the top level using vi.hoisted
const mockContentfulExport = vi.hoisted(() => vi.fn());

// Mock the entire exportSpace module to replace contentful-export
vi.mock('contentful-export', () => ({
  default: mockContentfulExport,
}));

// Mock the require function and module resolution
vi.mock('module', () => ({
  createRequire: vi.fn(() => vi.fn(() => mockContentfulExport)),
}));

// Mock the config module
vi.mock('../../../config/contentful.js', () => ({
  getDefaultClientConfig: vi.fn(() => ({
    accessToken: 'test-management-token',
    space: 'test-space-id',
    environment: 'test-environment',
  })),
}));

// Mock path module
vi.mock('path', () => ({
  default: {
    join: vi.fn((...args) => args.join('/')),
  },
}));

describe('exportSpace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock to return successful result by default
    mockContentfulExport.mockResolvedValue(mockExportResult);
  });

  it('should export space with minimal options', async () => {
    const testArgs = createExportTestArgs();

    const result = await createExportSpaceTool(testArgs);

    expect(mockContentfulExport).toHaveBeenCalledWith({
      ...testArgs,
      managementToken: 'test-management-token',
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
      deliveryToken: 'test-delivery-token',

      // Network options
      host: 'eu.contentful.com',
      hostDelivery: 'cdn.contentful.com',
      proxy: 'user:pass@proxy:8080',
      rawProxy: true,

      // Logging and debugging
      headers: {
        'X-Custom': 'value',
        'User-Agent': 'test-agent',
      },
      errorLogFile: '/logs/export.log',
      useVerboseRenderer: true,
      config: '/config/export.json',
    });

    const result = await createExportSpaceTool(testArgs);

    expect(mockContentfulExport).toHaveBeenCalledWith({
      ...testArgs,
      managementToken: 'test-management-token',
    });

    expect(result.content[0].text).toContain('Space exported successfully');
    expect(result.content[0].text).toContain(
      '/custom/export/dir/custom-export.json',
    );
  });

  it('should handle contentful-export errors', async () => {
    const error = new Error('Space not found');
    mockContentfulExport.mockRejectedValue(error);

    const testArgs = createExportTestArgs({
      spaceId: 'invalid-space-id',
    });

    const result = await createExportSpaceTool(testArgs);

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
