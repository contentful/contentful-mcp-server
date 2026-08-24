import { vi } from 'vitest';

/**
 * Shared mock objects for Component tests.
 * Mirrors the content-types mockClient pattern, adapted to the ExO
 * component plain client API.
 */
const {
  mockComponentGet,
  mockComponentGetMany,
  mockComponentCreate,
  mockComponentUpsert,
  mockComponentDelete,
  mockComponentPublish,
  mockComponentUnpublish,
  mockCreateToolClient,
} = vi.hoisted(() => {
  return {
    mockComponentGet: vi.fn(),
    mockComponentGetMany: vi.fn(),
    mockComponentCreate: vi.fn(),
    mockComponentUpsert: vi.fn(),
    mockComponentDelete: vi.fn(),
    mockComponentPublish: vi.fn(),
    mockComponentUnpublish: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        component: {
          get: mockComponentGet,
          getMany: mockComponentGetMany,
          create: mockComponentCreate,
          upsert: mockComponentUpsert,
          delete: mockComponentDelete,
          publish: mockComponentPublish,
          unpublish: mockComponentUnpublish,
        },
      };
    }),
  };
});

vi.mock('../../../utils/tools.js', async (importOriginal) => {
  const org = await importOriginal<typeof import('../../../utils/tools.js')>();
  return {
    ...org,
    createExoToolClient: mockCreateToolClient,
  };
});

export {
  mockComponentGet,
  mockComponentGetMany,
  mockComponentCreate,
  mockComponentUpsert,
  mockComponentDelete,
  mockComponentPublish,
  mockComponentUnpublish,
  mockCreateToolClient,
};

/**
 * Standard mock Component object used across tests.
 */
export const mockComponent = {
  sys: {
    id: 'test-component-id',
    type: 'Component' as const,
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
    createdBy: { sys: { type: 'Link', linkType: 'User', id: 'user-1' } },
    updatedAt: '2023-01-01T00:00:00Z',
    updatedBy: { sys: { type: 'Link', linkType: 'User', id: 'user-1' } },
  },
  name: 'Test Component',
  description: 'A test component for unit tests',
  viewports: [],
  contentProperties: [],
  designProperties: [],
};

/**
 * Standard test arguments for component operations.
 */
export const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  componentId: 'test-component-id',
};

/**
 * Mock cursor-paginated list response.
 */
export const mockComponentsResponse = {
  sys: { type: 'Array' as const },
  total: 2,
  limit: 10,
  items: [
    mockComponent,
    {
      ...mockComponent,
      sys: { ...mockComponent.sys, id: 'another-component' },
      name: 'Another Component',
    },
  ],
  pages: { next: 'next-cursor-token' },
};
