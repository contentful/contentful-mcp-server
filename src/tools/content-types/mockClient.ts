import { vi } from 'vitest';

/**
 * Shared mock objects for content type tests
 * Provides standardized mock client and content type objects used across all content type tests
 */
const {
  mockContentTypeGet,
  mockContentTypeCreate,
  mockContentTypeCreateWithId,
  mockContentTypeUpdate,
  mockContentTypeDelete,
  mockContentTypePublish,
  mockContentTypeUnpublish,
  mockContentTypeGetMany,
  mockCreateToolClient,
} = vi.hoisted(() => {
  return {
    mockContentTypeGet: vi.fn(),
    mockContentTypeCreate: vi.fn(),
    mockContentTypeCreateWithId: vi.fn(),
    mockContentTypeUpdate: vi.fn(),
    mockContentTypeDelete: vi.fn(),
    mockContentTypePublish: vi.fn(),
    mockContentTypeUnpublish: vi.fn(),
    mockContentTypeGetMany: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        contentType: {
          get: mockContentTypeGet,
          create: mockContentTypeCreate,
          createWithId: mockContentTypeCreateWithId,
          update: mockContentTypeUpdate,
          delete: mockContentTypeDelete,
          publish: mockContentTypePublish,
          unpublish: mockContentTypeUnpublish,
          getMany: mockContentTypeGetMany,
        },
      };
    }),
  };
});

vi.mock('../../utils/tools.js', async (importOriginal) => {
  const org = await importOriginal<typeof import('../../utils/tools.js')>();
  return {
    ...org,
    createToolClient: mockCreateToolClient,
  };
});

export {
  mockContentTypeGet,
  mockContentTypeCreate,
  mockContentTypeCreateWithId,
  mockContentTypeUpdate,
  mockContentTypeDelete,
  mockContentTypePublish,
  mockContentTypeUnpublish,
  mockContentTypeGetMany,
  mockCreateToolClient,
};

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
