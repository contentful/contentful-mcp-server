import { vi } from 'vitest';
import { createToolClient } from '../../utils/tools.js';

/**
 * Shared mock objects for asset tests
 * Provides standardized mock client and asset objects used across all asset tests
 */

// Create mock functions for the client
export const mockAssetGet = vi.fn();
export const mockAssetCreate = vi.fn();
export const mockAssetUpdate = vi.fn();
export const mockAssetDelete = vi.fn();
export const mockAssetPublish = vi.fn();
export const mockAssetUnpublish = vi.fn();
export const mockAssetGetMany = vi.fn();
export const mockAssetProcessForAllLocales = vi.fn();

// Mock bulk operations
export const mockBulkActionPublish = vi.fn();
export const mockBulkActionUnpublish = vi.fn();
export const mockBulkActionGet = vi.fn();

/**
 * Standard mock Contentful client with all asset operations
 */
export const mockClient = {
  asset: {
    get: mockAssetGet,
    create: mockAssetCreate,
    update: mockAssetUpdate,
    delete: mockAssetDelete,
    publish: mockAssetPublish,
    unpublish: mockAssetUnpublish,
    getMany: mockAssetGetMany,
    processForAllLocales: mockAssetProcessForAllLocales,
  },
  bulkAction: {
    publish: mockBulkActionPublish,
    unpublish: mockBulkActionUnpublish,
    get: mockBulkActionGet,
  },
};

/**
 * Sets up the mock client for tests
 * Call this in beforeEach to ensure the mock is properly configured
 */
export function setupMockClient() {
  vi.mocked(createToolClient).mockReturnValue(
    mockClient as unknown as ReturnType<typeof createToolClient>,
  );
}

/**
 * Standard mock asset object used across tests
 */
export const mockAsset = {
  sys: {
    id: 'test-asset-id',
    type: 'Asset' as const,
    version: 1,
    space: {
      sys: {
        type: 'Link' as const,
        linkType: 'Space' as const,
        id: 'test-space-id',
      },
    },
    environment: {
      sys: {
        type: 'Link' as const,
        linkType: 'Environment' as const,
        id: 'test-environment',
      },
    },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    publishedVersion: 1,
  },
  fields: {
    title: {
      'en-US': 'Test Asset',
    },
    description: {
      'en-US': 'A test asset for unit tests',
    },
    file: {
      'en-US': {
        fileName: 'test-image.jpg',
        contentType: 'image/jpeg',
        url: 'https://images.ctfassets.net/test/test-image.jpg',
        details: {
          size: 12345,
          image: {
            width: 800,
            height: 600,
          },
        },
      },
    },
  },
};

/**
 * Standard test arguments for asset operations
 */
export const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  assetId: 'test-asset-id',
};

/**
 * Mock file object for upload tests
 */
export const mockFile = {
  fileName: 'test-image.jpg',
  contentType: 'image/jpeg',
  upload: 'https://upload.example.com/test-upload-url',
};

/**
 * Mock assets list response
 */
export const mockAssetsResponse = {
  total: 2,
  skip: 0,
  limit: 3,
  items: [
    mockAsset,
    {
      ...mockAsset,
      sys: { ...mockAsset.sys, id: 'another-asset-id' },
      fields: {
        ...mockAsset.fields,
        title: { 'en-US': 'Another Test Asset' },
      },
    },
  ],
};

/**
 * Mock bulk action response
 */
export const mockBulkAction = {
  sys: {
    id: 'bulk-action-id',
    type: 'BulkAction',
    status: 'succeeded',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  action: 'publish',
  payload: {},
};

/**
 * Mock processed asset for upload
 */
export const mockProcessedAsset = {
  ...mockAsset,
  fields: {
    ...mockAsset.fields,
    file: {
      'en-US': {
        ...mockAsset.fields.file['en-US'],
        url: 'https://images.ctfassets.net/processed/test-image.jpg',
      },
    },
  },
};
