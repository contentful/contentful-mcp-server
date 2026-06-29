import { vi } from 'vitest';

/**
 * Shared mock objects for ComponentType tests.
 * Mirrors the content-types mockClient pattern, adapted to the ExO
 * componentType plain client API.
 */
const {
  mockComponentTypeGet,
  mockComponentTypeGetMany,
  mockComponentTypeCreate,
  mockComponentTypeUpsert,
  mockComponentTypeDelete,
  mockComponentTypePublish,
  mockComponentTypeUnpublish,
  mockCreateToolClient,
} = vi.hoisted(() => {
  return {
    mockComponentTypeGet: vi.fn(),
    mockComponentTypeGetMany: vi.fn(),
    mockComponentTypeCreate: vi.fn(),
    mockComponentTypeUpsert: vi.fn(),
    mockComponentTypeDelete: vi.fn(),
    mockComponentTypePublish: vi.fn(),
    mockComponentTypeUnpublish: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        componentType: {
          get: mockComponentTypeGet,
          getMany: mockComponentTypeGetMany,
          create: mockComponentTypeCreate,
          upsert: mockComponentTypeUpsert,
          delete: mockComponentTypeDelete,
          publish: mockComponentTypePublish,
          unpublish: mockComponentTypeUnpublish,
        },
      };
    }),
  };
});

vi.mock('../../../utils/tools.js', async (importOriginal) => {
  const org = await importOriginal<typeof import('../../../utils/tools.js')>();
  return {
    ...org,
    createToolClient: mockCreateToolClient,
  };
});

export {
  mockComponentTypeGet,
  mockComponentTypeGetMany,
  mockComponentTypeCreate,
  mockComponentTypeUpsert,
  mockComponentTypeDelete,
  mockComponentTypePublish,
  mockComponentTypeUnpublish,
  mockCreateToolClient,
};

/**
 * Standard mock ComponentType object used across tests.
 */
export const mockComponentType = {
  sys: {
    id: 'test-component-type-id',
    type: 'ComponentType' as const,
    version: 1,
    space: {
      sys: { type: 'Link' as const, linkType: 'Space' as const, id: 'test-space-id' },
    },
    environment: {
      sys: {
        type: 'Link' as const,
        linkType: 'Environment' as const,
        id: 'test-environment',
      },
    },
    createdAt: '2023-01-01T00:00:00Z',
    createdBy: { sys: { type: 'Link', linkType: 'User', id: 'user-1' } },
    updatedAt: '2023-01-01T00:00:00Z',
    updatedBy: { sys: { type: 'Link', linkType: 'User', id: 'user-1' } },
  },
  name: 'Test Component Type',
  description: 'A test component type for unit tests',
  viewports: [],
  contentProperties: [],
  designProperties: [],
};

/**
 * Standard test arguments for componentType operations.
 */
export const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  componentTypeId: 'test-component-type-id',
};

/**
 * Mock cursor-paginated list response.
 */
export const mockComponentTypesResponse = {
  sys: { type: 'Array' as const },
  total: 2,
  limit: 10,
  items: [
    mockComponentType,
    {
      ...mockComponentType,
      sys: { ...mockComponentType.sys, id: 'another-component-type' },
      name: 'Another Component Type',
    },
  ],
  pages: { next: 'next-cursor-token' },
};
