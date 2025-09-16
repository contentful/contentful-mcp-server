import { vi } from 'vitest';

/**
 * Mock client for space-to-space migration tools
 * Provides mocked contentful-export and contentful-import functions
 */

// Mock the contentful-export function
export const mockContentfulExport = vi.fn();

// Mock the contentful-import function
export const mockContentfulImport = vi.fn();

// Mock export result data
export const mockExportResult = {
  contentTypes: [
    {
      sys: { id: 'test-content-type', type: 'ContentType' },
      name: 'Test Content Type',
      fields: [],
    },
  ],
  entries: [
    {
      sys: { id: 'test-entry', type: 'Entry' },
      fields: { title: { 'en-US': 'Test Entry' } },
    },
  ],
  assets: [
    {
      sys: { id: 'test-asset', type: 'Asset' },
      fields: { title: { 'en-US': 'Test Asset' } },
    },
  ],
  locales: [
    {
      sys: { id: 'en-US', type: 'Locale' },
      code: 'en-US',
      name: 'English (United States)',
      default: true,
    },
  ],
  tags: [
    {
      sys: { id: 'test-tag', type: 'Tag' },
      name: 'Test Tag',
    },
  ],
  webhooks: [],
  roles: [],
  editorInterfaces: [],
};

// Mock import result data
export const mockImportResult = {
  contentTypes: [
    {
      sys: { id: 'imported-content-type', type: 'ContentType' },
      name: 'Imported Content Type',
    },
  ],
  entries: [
    {
      sys: { id: 'imported-entry', type: 'Entry' },
      fields: { title: { 'en-US': 'Imported Entry' } },
    },
  ],
  assets: [
    {
      sys: { id: 'imported-asset', type: 'Asset' },
      fields: { title: { 'en-US': 'Imported Asset' } },
    },
  ],
  locales: [
    {
      sys: { id: 'en-US', type: 'Locale' },
      code: 'en-US',
      name: 'English (United States)',
      default: true,
    },
  ],
  tags: [],
  webhooks: [],
  roles: [],
  editorInterfaces: [],
};

/**
 * Standard test arguments for space-to-space migration operations
 */
export const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
};

/**
 * Helper function to create import test args with defaults
 */
export const createImportTestArgs = (
  overrides: Record<string, unknown> = {},
) => ({
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  contentModelOnly: false,
  skipContentModel: false,
  skipLocales: false,
  skipContentUpdates: false,
  skipContentPublishing: false,
  uploadAssets: false,
  skipAssetUpdates: false,
  timeout: 3000,
  retryLimit: 10,
  rateLimit: 7,
  ...overrides,
});

/**
 * Helper function to create export test args with defaults
 */
export const createExportTestArgs = (
  overrides: Record<string, unknown> = {},
) => ({
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  saveFile: true,
  includeDrafts: false,
  includeArchived: false,
  skipContentModel: false,
  skipEditorInterfaces: false,
  skipContent: false,
  skipRoles: false,
  skipTags: false,
  skipWebhooks: false,
  stripTags: false,
  contentOnly: false,
  downloadAssets: false,
  maxAllowedLimit: 1000,
  rawProxy: false,
  useVerboseRenderer: false,
  ...overrides,
});

/**
 * Mock parameter collection arguments
 */
export const mockParamCollectionArgs = {
  ...mockArgs,
  confirmation: false,
  export: {
    spaceId: 'source-space-id',
    environmentId: 'master',
    exportDir: '/test/export',
    contentFile: 'export.json',
  },
  import: {
    spaceId: 'target-space-id',
    environmentId: 'master',
    contentFile: '/test/export/export.json',
  },
};

/**
 * Mock migration handler arguments
 */
export const mockMigrationHandlerArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  enableWorkflow: true,
};
