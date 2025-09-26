import { vi } from 'vitest';

const {
  mockLocaleCreate,
  mockLocaleGet,
  mockLocaleDelete,
  mockLocaleGetMany,
  mockLocaleUpdate,
  mockCreateToolClient,
} = vi.hoisted(() => {
  return {
    mockLocaleCreate: vi.fn(),
    mockLocaleGet: vi.fn(),
    mockLocaleDelete: vi.fn(),
    mockLocaleGetMany: vi.fn(),
    mockLocaleUpdate: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        locale: {
          create: mockLocaleCreate,
          get: mockLocaleGet,
          delete: mockLocaleDelete,
          getMany: mockLocaleGetMany,
          update: mockLocaleUpdate,
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
  mockLocaleCreate,
  mockLocaleGet,
  mockLocaleDelete,
  mockLocaleGetMany,
  mockLocaleUpdate,
  mockCreateToolClient,
};

export const testLocale = {
  name: 'Test Locale',
  code: 'en-US',
  fallbackCode: null,
  contentDeliveryApi: true,
  contentManagementApi: true,
  default: true,
  optional: false,
  sys: {
    id: 'test-locale-id',
    type: 'Locale',
    space: { sys: { type: 'Link', linkType: 'Space', id: 'test-space-id' } },
    environment: {
      sys: { type: 'Link', linkType: 'Environment', id: 'test-environment-id' },
    },
    createdAt: '2025-08-25T10:00:00Z',
    updatedAt: '2025-08-25T10:00:00Z',
    version: 1,
  },
};

export const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment-id',
  cmaToken: 'test-cma-token',
};
