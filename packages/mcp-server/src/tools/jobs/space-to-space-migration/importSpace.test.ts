import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createImportSpaceTool } from './importSpace.js';
import { formatResponse } from '../../../utils/formatters.js';
import { mockImportResult, createImportTestArgs } from './mockClient.js';

// Mock contentful-import at the top level using vi.hoisted
const mockContentfulImport = vi.hoisted(() => vi.fn());

// Mock the entire importSpace module to replace contentful-import
vi.mock('contentful-import', () => ({
  default: mockContentfulImport,
}));

// Mock the require function and module resolution
vi.mock('module', () => ({
  createRequire: vi.fn(() => vi.fn(() => mockContentfulImport)),
}));

// Mock the config module
vi.mock('../../../config/contentful.js', () => ({
  getDefaultClientConfig: vi.fn(() => ({
    accessToken: 'test-management-token',
    space: 'test-space-id',
    environment: 'test-environment',
  })),
}));

describe('importSpace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock to return successful result by default
    mockContentfulImport.mockResolvedValue(mockImportResult);
  });

  it('should import space with minimal options', async () => {
    const testArgs = createImportTestArgs({
      content: { contentTypes: [], entries: [] },
    });

    const result = await createImportSpaceTool(testArgs);

    expect(mockContentfulImport).toHaveBeenCalledWith({
      ...testArgs,
      managementToken: 'test-management-token',
      environmentId: 'test-environment',
    });

    const expectedResponse = formatResponse('Space imported successfully', {
      spaceId: 'test-space-id',
      environmentId: 'test-environment',
      contentTypes: 1,
      entries: 1,
      assets: 1,
      locales: 1,
      tags: 0,
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

  it('should import space with complex configuration options', async () => {
    const testArgs = createImportTestArgs({
      // Content options
      contentFile: '/exports/full-export.json',
      content: { contentTypes: [{ sys: { id: 'ct1' } }], entries: [] },
      contentModelOnly: false,

      // Skip options
      skipContentModel: false,
      skipLocales: true,
      skipContentUpdates: true,
      skipContentPublishing: false,

      // Asset options
      uploadAssets: true,
      skipAssetUpdates: false,
      assetsDirectory: '/assets',

      // Performance options
      timeout: 5000,
      retryLimit: 15,
      rateLimit: 10,

      // Network options
      host: 'eu.contentful.com',
      proxy: 'user:pass@proxy:8080',
      rawProxy: true,

      // Logging and debugging
      headers: {
        'X-Custom': 'value',
        'User-Agent': 'test-agent',
      },
      errorLogFile: '/logs/import.log',
      useVerboseRenderer: true,
      config: '/config/import.json',
    });

    const result = await createImportSpaceTool(testArgs);

    expect(mockContentfulImport).toHaveBeenCalledWith({
      ...testArgs,
      managementToken: 'test-management-token',
    });

    expect(result.content[0].text).toContain('Space imported successfully');
  });

  it('should handle contentful-import errors', async () => {
    const error = new Error('Space not found');
    mockContentfulImport.mockRejectedValue(error);

    const testArgs = createImportTestArgs({
      spaceId: 'invalid-space-id',
      content: { contentTypes: [], entries: [] },
    });

    const result = await createImportSpaceTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error importing space: Failed to import space: Space not found',
        },
      ],
    });
  });
});
