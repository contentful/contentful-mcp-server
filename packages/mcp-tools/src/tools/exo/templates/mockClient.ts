import { vi } from 'vitest';

/**
 * Shared mock objects for Template tests.
 * Mirrors the component-types mockClient pattern, adapted to the ExO
 * template plain client API.
 */
const {
  mockTemplateGet,
  mockTemplateGetMany,
  mockTemplateCreate,
  mockTemplateUpsert,
  mockTemplateDelete,
  mockTemplatePublish,
  mockTemplateUnpublish,
  mockCreateToolClient,
} = vi.hoisted(() => {
  return {
    mockTemplateGet: vi.fn(),
    mockTemplateGetMany: vi.fn(),
    mockTemplateCreate: vi.fn(),
    mockTemplateUpsert: vi.fn(),
    mockTemplateDelete: vi.fn(),
    mockTemplatePublish: vi.fn(),
    mockTemplateUnpublish: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        template: {
          get: mockTemplateGet,
          getMany: mockTemplateGetMany,
          create: mockTemplateCreate,
          upsert: mockTemplateUpsert,
          delete: mockTemplateDelete,
          publish: mockTemplatePublish,
          unpublish: mockTemplateUnpublish,
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
  mockTemplateGet,
  mockTemplateGetMany,
  mockTemplateCreate,
  mockTemplateUpsert,
  mockTemplateDelete,
  mockTemplatePublish,
  mockTemplateUnpublish,
  mockCreateToolClient,
};

/**
 * Standard mock Template object used across tests.
 */
export const mockTemplate = {
  sys: {
    id: 'test-template-id',
    type: 'Template' as const,
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
  name: 'Test Template',
  description: 'A test template for unit tests',
  viewports: [],
  contentProperties: [],
  designProperties: [],
};

/**
 * Standard test arguments for template operations.
 */
export const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  templateId: 'test-template-id',
};

/**
 * Mock cursor-paginated list response.
 */
export const mockTemplatesResponse = {
  sys: { type: 'Array' as const },
  total: 2,
  limit: 10,
  items: [
    mockTemplate,
    {
      ...mockTemplate,
      sys: { ...mockTemplate.sys, id: 'another-template' },
      name: 'Another Template',
    },
  ],
  pages: { next: 'next-cursor-token' },
};
