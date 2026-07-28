import { vi } from 'vitest';

const {
  mockFragmentGet,
  mockFragmentGetMany,
  mockFragmentCreate,
  mockFragmentUpsert,
  mockFragmentDelete,
  mockFragmentPublish,
  mockFragmentUnpublish,
  mockCreateToolClient,
} = vi.hoisted(() => {
  return {
    mockFragmentGet: vi.fn(),
    mockFragmentGetMany: vi.fn(),
    mockFragmentCreate: vi.fn(),
    mockFragmentUpsert: vi.fn(),
    mockFragmentDelete: vi.fn(),
    mockFragmentPublish: vi.fn(),
    mockFragmentUnpublish: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        fragment: {
          get: mockFragmentGet,
          getMany: mockFragmentGetMany,
          create: mockFragmentCreate,
          upsert: mockFragmentUpsert,
          delete: mockFragmentDelete,
          publish: mockFragmentPublish,
          unpublish: mockFragmentUnpublish,
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
  mockFragmentGet,
  mockFragmentGetMany,
  mockFragmentCreate,
  mockFragmentUpsert,
  mockFragmentDelete,
  mockFragmentPublish,
  mockFragmentUnpublish,
  mockCreateToolClient,
};

/**
 * Standard mock Fragment object used across tests.
 */
export const mockFragment = {
  sys: {
    id: 'test-fragment-id',
    type: 'Fragment' as const,
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
    componentType: {
      sys: {
        type: 'ResourceLink' as const,
        linkType: 'Contentful:ComponentType' as const,
        urn: 'crn:contentful:::content:spaces/test-space-id/component-types/test-component-type-id',
      },
    },
    createdAt: '2023-01-01T00:00:00Z',
    createdBy: { sys: { type: 'Link', linkType: 'User', id: 'user-1' } },
    updatedAt: '2023-01-01T00:00:00Z',
    updatedBy: { sys: { type: 'Link', linkType: 'User', id: 'user-1' } },
  },
  name: 'Test Fragment',
  description: 'A test fragment for unit tests',
  viewports: [],
  designProperties: {},
};

/**
 * Standard test arguments for fragment operations.
 */
export const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  fragmentId: 'test-fragment-id',
};

/**
 * Mock cursor-paginated list response.
 */
export const mockFragmentsResponse = {
  sys: { type: 'Array' as const },
  total: 2,
  limit: 10,
  items: [
    mockFragment,
    {
      ...mockFragment,
      sys: { ...mockFragment.sys, id: 'another-fragment' },
      name: 'Another Fragment',
    },
  ],
  pages: { next: 'next-cursor-token' },
};
