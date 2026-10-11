import { vi } from 'vitest';
import type { DataAssemblyParameterConfig } from '../../../types/dataAssemblySchemas.js';

const {
  mockDataAssemblyGet,
  mockDataAssemblyGetMany,
  mockDataAssemblyGetPublished,
  mockDataAssemblyGetManyPublished,
  mockDataAssemblyCreate,
  mockDataAssemblyUpdate,
  mockDataAssemblyDelete,
  mockDataAssemblyPublish,
  mockDataAssemblyUnpublish,
  mockCreateToolClient,
} = vi.hoisted(() => {
  return {
    mockDataAssemblyGet: vi.fn(),
    mockDataAssemblyGetMany: vi.fn(),
    mockDataAssemblyGetPublished: vi.fn(),
    mockDataAssemblyGetManyPublished: vi.fn(),
    mockDataAssemblyCreate: vi.fn(),
    mockDataAssemblyUpdate: vi.fn(),
    mockDataAssemblyDelete: vi.fn(),
    mockDataAssemblyPublish: vi.fn(),
    mockDataAssemblyUnpublish: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        dataAssembly: {
          get: mockDataAssemblyGet,
          getMany: mockDataAssemblyGetMany,
          getPublished: mockDataAssemblyGetPublished,
          getManyPublished: mockDataAssemblyGetManyPublished,
          create: mockDataAssemblyCreate,
          update: mockDataAssemblyUpdate,
          delete: mockDataAssemblyDelete,
          publish: mockDataAssemblyPublish,
          unpublish: mockDataAssemblyUnpublish,
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
  mockDataAssemblyGet,
  mockDataAssemblyGetMany,
  mockDataAssemblyGetPublished,
  mockDataAssemblyGetManyPublished,
  mockDataAssemblyCreate,
  mockDataAssemblyUpdate,
  mockDataAssemblyDelete,
  mockDataAssemblyPublish,
  mockDataAssemblyUnpublish,
  mockCreateToolClient,
};

export const mockParameters = [
  {
    id: 'second',
    type: 'String',
    required: false,
    fallbackValue: '',
    locked: false,
    validation: { allowedValues: ['', 'headline'] },
  },
  {
    id: 'first',
    type: 'Number',
    required: true,
    name: 'Limit',
    description: 'Maximum results',
    fallbackValue: 10,
    locked: true,
    validation: { min: 1, max: 20 },
  },
] satisfies DataAssemblyParameterConfig;

/**
 * Standard mock DataAssembly object used across tests.
 */
export const mockDataAssembly = {
  sys: {
    id: 'test-data-assembly-id',
    type: 'DataAssembly' as const,
    version: 1,
    dataType: [],
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
    createdBy: {
      sys: { type: 'Link' as const, linkType: 'User' as const, id: 'user-1' },
    },
    updatedAt: '2023-01-01T00:00:00Z',
  },
  name: 'Test Data Assembly',
  description: 'A test data assembly for unit tests',
  metadata: { tags: [] },
  parameters: mockParameters,
  resolvers: {},
  return: {},
};

/**
 * Standard test arguments for data assembly operations.
 */
export const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  dataAssemblyId: 'test-data-assembly-id',
};

/**
 * Mock cursor-paginated list response.
 */
export const mockDataAssembliesResponse = {
  sys: { type: 'Array' as const },
  total: 2,
  items: [
    mockDataAssembly,
    {
      ...mockDataAssembly,
      sys: { ...mockDataAssembly.sys, id: 'another-data-assembly' },
      name: 'Another Data Assembly',
    },
  ],
  pages: { next: 'next-cursor-token' },
};
