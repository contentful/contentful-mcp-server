import { vi } from 'vitest';

/**
 * Shared mock objects for ExperienceTemplate tests.
 * Mirrors the component-types mockClient pattern, adapted to the ExO
 * experience template plain client API.
 */
const {
  mockExperienceTemplateGet,
  mockExperienceTemplateGetMany,
  mockExperienceTemplateCreate,
  mockExperienceTemplateUpsert,
  mockExperienceTemplateDelete,
  mockExperienceTemplatePublish,
  mockExperienceTemplateUnpublish,
  mockCreateToolClient,
} = vi.hoisted(() => {
  return {
    mockExperienceTemplateGet: vi.fn(),
    mockExperienceTemplateGetMany: vi.fn(),
    mockExperienceTemplateCreate: vi.fn(),
    mockExperienceTemplateUpsert: vi.fn(),
    mockExperienceTemplateDelete: vi.fn(),
    mockExperienceTemplatePublish: vi.fn(),
    mockExperienceTemplateUnpublish: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        experienceTemplate: {
          get: mockExperienceTemplateGet,
          getMany: mockExperienceTemplateGetMany,
          create: mockExperienceTemplateCreate,
          upsert: mockExperienceTemplateUpsert,
          delete: mockExperienceTemplateDelete,
          publish: mockExperienceTemplatePublish,
          unpublish: mockExperienceTemplateUnpublish,
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
  mockExperienceTemplateGet,
  mockExperienceTemplateGetMany,
  mockExperienceTemplateCreate,
  mockExperienceTemplateUpsert,
  mockExperienceTemplateDelete,
  mockExperienceTemplatePublish,
  mockExperienceTemplateUnpublish,
  mockCreateToolClient,
};

/**
 * Standard mock ExperienceTemplate object used across tests.
 */
export const mockExperienceTemplate = {
  sys: {
    id: 'test-experience-template-id',
    type: 'ExperienceTemplate' as const,
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
  name: 'Test Experience Template',
  description: 'A test experience template for unit tests',
  viewports: [],
  contentProperties: [],
  designProperties: [],
};

/**
 * Standard test arguments for experience template operations.
 */
export const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  experienceTemplateId: 'test-experience-template-id',
};

/**
 * Mock cursor-paginated list response.
 */
export const mockExperienceTemplatesResponse = {
  sys: { type: 'Array' as const },
  total: 2,
  limit: 10,
  items: [
    mockExperienceTemplate,
    {
      ...mockExperienceTemplate,
      sys: { ...mockExperienceTemplate.sys, id: 'another-experience-template' },
      name: 'Another Experience Template',
    },
  ],
  pages: { next: 'next-cursor-token' },
};
