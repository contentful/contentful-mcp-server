import { vi } from 'vitest';

const {
  mockExperienceFragmentGet,
  mockExperienceFragmentGetMany,
  mockExperienceFragmentCreate,
  mockExperienceFragmentUpsert,
  mockExperienceFragmentDelete,
  mockExperienceFragmentPublish,
  mockExperienceFragmentUnpublish,
  mockCreateToolClient,
} = vi.hoisted(() => {
  return {
    mockExperienceFragmentGet: vi.fn(),
    mockExperienceFragmentGetMany: vi.fn(),
    mockExperienceFragmentCreate: vi.fn(),
    mockExperienceFragmentUpsert: vi.fn(),
    mockExperienceFragmentDelete: vi.fn(),
    mockExperienceFragmentPublish: vi.fn(),
    mockExperienceFragmentUnpublish: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        experienceFragment: {
          get: mockExperienceFragmentGet,
          getMany: mockExperienceFragmentGetMany,
          create: mockExperienceFragmentCreate,
          upsert: mockExperienceFragmentUpsert,
          delete: mockExperienceFragmentDelete,
          publish: mockExperienceFragmentPublish,
          unpublish: mockExperienceFragmentUnpublish,
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
  mockExperienceFragmentGet,
  mockExperienceFragmentGetMany,
  mockExperienceFragmentCreate,
  mockExperienceFragmentUpsert,
  mockExperienceFragmentDelete,
  mockExperienceFragmentPublish,
  mockExperienceFragmentUnpublish,
  mockCreateToolClient,
};

/**
 * Standard mock ExperienceFragment object used across tests.
 */
export const mockExperienceFragment = {
  sys: {
    id: 'test-experience-fragment-id',
    type: 'ExperienceFragment' as const,
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
    component: {
      sys: {
        type: 'ResourceLink' as const,
        linkType: 'Contentful:Component' as const,
        urn: 'crn:contentful:::experience:spaces/test-space-id/environments/test-environment/components/test-component-id',
      },
    },
    createdAt: '2023-01-01T00:00:00Z',
    createdBy: { sys: { type: 'Link', linkType: 'User', id: 'user-1' } },
    updatedAt: '2023-01-01T00:00:00Z',
    updatedBy: { sys: { type: 'Link', linkType: 'User', id: 'user-1' } },
  },
  name: 'Test Experience Fragment',
  description: 'A test experience fragment for unit tests',
  viewports: [],
  designProperties: {},
};

/**
 * Standard test arguments for experience fragment operations.
 */
export const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  experienceFragmentId: 'test-experience-fragment-id',
};

/**
 * Mock cursor-paginated list response.
 */
export const mockExperienceFragmentsResponse = {
  sys: { type: 'Array' as const },
  total: 2,
  limit: 10,
  items: [
    mockExperienceFragment,
    {
      ...mockExperienceFragment,
      sys: { ...mockExperienceFragment.sys, id: 'another-experience-fragment' },
      name: 'Another Experience Fragment',
    },
  ],
  pages: { next: 'next-cursor-token' },
};
