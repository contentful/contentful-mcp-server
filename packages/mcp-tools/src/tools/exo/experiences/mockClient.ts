import { vi } from 'vitest';

const {
  mockExperienceGet,
  mockExperienceGetMany,
  mockExperienceCreate,
  mockExperienceUpsert,
  mockExperienceDelete,
  mockExperiencePublish,
  mockExperienceUnpublish,
  mockCreateToolClient,
} = vi.hoisted(() => {
  return {
    mockExperienceGet: vi.fn(),
    mockExperienceGetMany: vi.fn(),
    mockExperienceCreate: vi.fn(),
    mockExperienceUpsert: vi.fn(),
    mockExperienceDelete: vi.fn(),
    mockExperiencePublish: vi.fn(),
    mockExperienceUnpublish: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        experience: {
          get: mockExperienceGet,
          getMany: mockExperienceGetMany,
          create: mockExperienceCreate,
          upsert: mockExperienceUpsert,
          delete: mockExperienceDelete,
          publish: mockExperiencePublish,
          unpublish: mockExperienceUnpublish,
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
  mockExperienceGet,
  mockExperienceGetMany,
  mockExperienceCreate,
  mockExperienceUpsert,
  mockExperienceDelete,
  mockExperiencePublish,
  mockExperienceUnpublish,
  mockCreateToolClient,
};

export const mockExperience = {
  sys: {
    id: 'test-experience-id',
    type: 'Experience' as const,
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
    template: {
      sys: {
        type: 'ResourceLink' as const,
        linkType: 'Contentful:Template' as const,
        urn: 'crn:contentful:::content:spaces/test-space-id/environments/test-environment/templates/test-template-id',
      },
    },
    createdAt: '2023-01-01T00:00:00Z',
    createdBy: { sys: { type: 'Link', linkType: 'User', id: 'user-1' } },
    updatedAt: '2023-01-01T00:00:00Z',
    updatedBy: { sys: { type: 'Link', linkType: 'User', id: 'user-1' } },
  },
  name: 'Test Experience',
  description: 'A test experience for unit tests',
  viewports: [],
  designProperties: {},
};

export const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  experienceId: 'test-experience-id',
};

export const mockExperiencesResponse = {
  sys: { type: 'Array' as const },
  total: 2,
  limit: 10,
  items: [
    mockExperience,
    {
      ...mockExperience,
      sys: { ...mockExperience.sys, id: 'another-experience' },
      name: 'Another Experience',
    },
  ],
  pages: { next: 'next-cursor-token' },
};
