import { vi } from 'vitest';
import { createToolClient } from '../../utils/tools.js';

/**
 * Shared mock objects for entry tests
 * Provides standardized mock client and entry objects used across all entry tests
 */

// Create mock functions for the client
export const mockEntryGet = vi.fn();
export const mockEntryCreate = vi.fn();
export const mockEntryUpdate = vi.fn();
export const mockEntryDelete = vi.fn();
export const mockEntryPublish = vi.fn();
export const mockEntryUnpublish = vi.fn();
export const mockEntryGetMany = vi.fn();
export const mockBulkActionPublish = vi.fn();
export const mockBulkActionUnpublish = vi.fn();

/**
 * Standard mock Contentful client with all entry operations
 */
export const mockClient = {
  entry: {
    get: mockEntryGet,
    create: mockEntryCreate,
    update: mockEntryUpdate,
    delete: mockEntryDelete,
    publish: mockEntryPublish,
    unpublish: mockEntryUnpublish,
    getMany: mockEntryGetMany,
  },
  bulkAction: {
    publish: mockBulkActionPublish,
    unpublish: mockBulkActionUnpublish,
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
 * Standard mock entry object used across tests
 */
export const mockEntry = {
  sys: {
    id: 'test-entry-id',
    type: 'Entry' as const,
    contentType: {
      sys: {
        id: 'test-content-type',
        type: 'Link' as const,
        linkType: 'ContentType' as const,
      },
    },
    version: 1,
  },
  fields: {
    title: { 'en-US': 'Test Entry Title' },
    description: { 'en-US': 'Test Entry Description' },
  },
};

/**
 * Standard test arguments for entry operations
 */
export const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  entryId: 'test-entry-id',
};

/**
 * Standard test arguments for bulk operations
 */
export const mockBulkArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  entryId: ['entry-1', 'entry-2'],
};
