import { vi } from 'vitest';
import { createToolClient } from '../../utils/tools.js';

/**
 * Shared mock objects for content type tests
 * Provides standardized mock client and content type objects used across all content type tests
 */

// Create mock functions for the client
export const mockContentTypeGet = vi.fn();
export const mockContentTypeCreate = vi.fn();
export const mockContentTypeUpdate = vi.fn();
export const mockContentTypeDelete = vi.fn();
export const mockContentTypePublish = vi.fn();
export const mockContentTypeUnpublish = vi.fn();
export const mockContentTypeGetMany = vi.fn();

/**
 * Standard mock Contentful client with all content type operations
 */
export const mockClient = {
  contentType: {
    get: mockContentTypeGet,
    create: mockContentTypeCreate,
    update: mockContentTypeUpdate,
    delete: mockContentTypeDelete,
    publish: mockContentTypePublish,
    unpublish: mockContentTypeUnpublish,
    getMany: mockContentTypeGetMany,
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
 * Standard mock content type object used across tests
 */
export const mockContentType = {
  sys: {
    id: 'test-content-type-id',
    type: 'ContentType' as const,
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
  },
  name: 'Test Content Type',
  description: 'A test content type for unit tests',
  displayField: 'title',
  fields: [
    {
      id: 'title',
      name: 'Title',
      type: 'Symbol',
      required: true,
      localized: false,
      validations: [],
    },
    {
      id: 'description',
      name: 'Description',
      type: 'Text',
      required: false,
      localized: false,
      validations: [],
    },
  ],
};

/**
 * Standard test arguments for content type operations
 */
export const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  contentTypeId: 'test-content-type-id',
};

/**
 * Mock field definitions for testing
 */
export const mockField = {
  id: 'title',
  name: 'Title',
  type: 'Symbol',
  required: true,
  localized: false,
  validations: [],
};

export const mockTextField = {
  id: 'description',
  name: 'Description',
  type: 'Text',
  required: false,
  localized: false,
  validations: [],
};

export const mockLinkField = {
  id: 'relatedEntry',
  name: 'Related Entry',
  type: 'Link',
  linkType: 'Entry',
  required: false,
  localized: false,
  validations: [],
};

/**
 * Mock content types list response
 */
export const mockContentTypesResponse = {
  total: 2,
  skip: 0,
  limit: 10,
  items: [
    mockContentType,
    {
      ...mockContentType,
      sys: { ...mockContentType.sys, id: 'another-content-type' },
      name: 'Another Content Type',
    },
  ],
};
