import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createExportSpaceTool } from './exportSpace.js';
import { formatResponse } from '../../../utils/formatters.js';
import { mockExportResult, createExportTestArgs } from './mockClient.js';
import { ExportParamsSchema } from './types.js';

// Mock contentful-export at the top level using vi.hoisted
const mockContentfulExport = vi.hoisted(() => vi.fn());
const mockMkdir = vi.hoisted(() => vi.fn());
const mockMkdtemp = vi.hoisted(() => vi.fn());
const mockRealpath = vi.hoisted(() => vi.fn());

// Mock the entire exportSpace module to replace contentful-export
vi.mock('contentful-export', () => ({
  default: mockContentfulExport,
}));

vi.mock('node:fs/promises', () => ({
  mkdir: mockMkdir,
  mkdtemp: mockMkdtemp,
  realpath: mockRealpath,
}));

// Mock the require function and module resolution
vi.mock('module', () => ({
  createRequire: vi.fn(() => vi.fn(() => mockContentfulExport)),
}));

import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('exportSpace', () => {
  const mockConfig = createMockConfig({
    exportBaseDir: '/server/export-root',
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockMkdir.mockResolvedValue(undefined);
    mockRealpath.mockImplementation(async (directory) => directory);
    mockMkdtemp.mockImplementation(async (prefix) => `${prefix}test-directory`);
    // Reset the mock to return successful result by default
    mockContentfulExport.mockResolvedValue(mockExportResult);
  });

  it('does not expose path controls in the export tool schema', () => {
    for (const field of ['exportDir', 'contentFile', 'errorLogFile']) {
      expect(ExportParamsSchema.shape).not.toHaveProperty(field);
    }
  });

  it('should export space with minimal options', async () => {
    const testArgs = createExportTestArgs();

    const tool = createExportSpaceTool(mockConfig);
    const result = await tool(testArgs);

    const exportDir = '/server/export-root/contentful-export-test-directory';

    expect(mockContentfulExport).toHaveBeenCalledWith({
      ...testArgs,
      managementToken: mockConfig.accessToken,
      host: 'api.contentful.com',
      environmentId: 'test-environment',
      exportDir,
      contentFile: 'contentful-export.json',
      errorLogFile: `${exportDir}/contentful-export-error.log`,
    });
    expect(mockMkdir).toHaveBeenCalledWith('/server/export-root', {
      recursive: true,
    });
    expect(mockRealpath).toHaveBeenCalledWith('/server/export-root');
    expect(mockMkdtemp).toHaveBeenCalledWith(
      '/server/export-root/contentful-export-',
    );

    const expectedResponse = formatResponse('Space exported successfully', {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      exportPath: `${exportDir}/contentful-export.json`,
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

  it('defaults a missing environment to master', async () => {
    const tool = createExportSpaceTool(mockConfig);
    const argsWithoutEnvironment: Record<string, unknown> = {
      ...createExportTestArgs(),
    };
    delete argsWithoutEnvironment['environmentId'];

    await tool(argsWithoutEnvironment as Parameters<typeof tool>[0]);

    expect(mockContentfulExport).toHaveBeenCalledWith(
      expect.objectContaining({ environmentId: 'master' }),
    );
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
      exportBaseDir: '/server/export-root',
      deliveryToken: 'cfg-delivery-token',
      hostDelivery: 'cdn.eu.contentful.com',
    });

    const tool = createExportSpaceTool(configWithDelivery);
    const result = await tool(testArgs);

    expect(mockContentfulExport).toHaveBeenCalledWith({
      ...Object.fromEntries(
        Object.entries(testArgs).filter(
          ([key]) =>
            !['exportDir', 'contentFile', 'errorLogFile'].includes(key),
        ),
      ),
      managementToken: configWithDelivery.accessToken,
      host: 'api.contentful.com',
      deliveryToken: 'cfg-delivery-token',
      hostDelivery: 'cdn.eu.contentful.com',
      exportDir: '/server/export-root/contentful-export-test-directory',
      contentFile: 'contentful-export.json',
      errorLogFile:
        '/server/export-root/contentful-export-test-directory/contentful-export-error.log',
    });

    expect(result.content[0].text).toContain('Space exported successfully');
    expect(result.content[0].text).toContain(
      '/server/export-root/contentful-export-test-directory/contentful-export.json',
    );
  });

  it('uses the canonical export root before creating the per-export directory', async () => {
    mockRealpath.mockResolvedValue('/real/server/export-root');
    const tool = createExportSpaceTool(mockConfig);

    await tool(createExportTestArgs());

    expect(mockMkdtemp).toHaveBeenCalledWith(
      '/real/server/export-root/contentful-export-',
    );
  });

  it.each([
    {
      name: 'sibling-prefix directory',
      exportDir: '/server/export-root-evil',
      contentFile: 'export.json',
      errorLogFile: 'error.log',
    },
    {
      name: 'traversal path',
      exportDir: '../../outside',
      contentFile: '../export.json',
      errorLogFile: '../../error.log',
    },
    {
      name: 'absolute POSIX path',
      exportDir: '/etc',
      contentFile: '/etc/passwd',
      errorLogFile: '/tmp/error.log',
    },
    {
      name: 'absolute Windows path',
      exportDir: String.raw`C:\\Users\\attacker\\exports`,
      contentFile: String.raw`C:\\Users\\attacker\\export.json`,
      errorLogFile: String.raw`C:\\Users\\attacker\\error.log`,
    },
    {
      name: 'null-byte path',
      exportDir: '/server/export-root\u0000evil',
      contentFile: 'export\u0000.json',
      errorLogFile: 'error\u0000.log',
    },
  ])('does not forward $name path controls', async (paths) => {
    const tool = createExportSpaceTool(mockConfig);

    await tool(createExportTestArgs(paths));

    const forwarded = mockContentfulExport.mock.calls.at(-1)?.[0] as Record<
      string,
      unknown
    >;
    expect(forwarded['exportDir']).toBe(
      '/server/export-root/contentful-export-test-directory',
    );
    expect(forwarded['contentFile']).toBe('contentful-export.json');
    expect(forwarded['errorLogFile']).toBe(
      '/server/export-root/contentful-export-test-directory/contentful-export-error.log',
    );
  });

  it('forwards only safe export options and server-configured endpoints', async () => {
    const configWithAll = createMockConfig({
      exportBaseDir: '/server/export-root',
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
        exportDir: '/tmp/untrusted-export',
        contentFile: '/tmp/untrusted-content.json',
        errorLogFile: '/tmp/untrusted-error.log',
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
    expect(forwarded['exportDir']).toBe(
      '/server/export-root/contentful-export-test-directory',
    );
    expect(forwarded['contentFile']).toBe('contentful-export.json');
    expect(forwarded['errorLogFile']).toBe(
      '/server/export-root/contentful-export-test-directory/contentful-export-error.log',
    );
  });

  it('should handle contentful-export errors', async () => {
    const error = new Error('Space not found');
    mockContentfulExport.mockRejectedValue(error);

    const testArgs = createExportTestArgs({
      spaceId: 'invalid-space-id',
    });

    const tool = createExportSpaceTool(mockConfig);
    const result = await tool(testArgs);

    expect(mockContentfulExport).toHaveBeenCalledWith(
      expect.objectContaining({
        exportDir: '/server/export-root/contentful-export-test-directory',
        errorLogFile:
          '/server/export-root/contentful-export-test-directory/contentful-export-error.log',
      }),
    );

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
