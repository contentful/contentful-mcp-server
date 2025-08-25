import { vi } from 'vitest';

const {
  mockLocaleCreate,
  mockLocaleGet,
  mockLocaleDelete,
  mockCreateToolClient,
} = vi.hoisted(() => {
  return {
    mockLocaleCreate: vi.fn(),
    mockLocaleGet: vi.fn(),
    mockLocaleDelete: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        locale: {
          create: mockLocaleCreate,
          get: mockLocaleGet,
          delete: mockLocaleDelete,
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
  mockCreateToolClient,
};

export const testLocale = {
  name: 'Test Locale',
  code: 'en-US',
  fallbackCode: null,
  sys: {
    id: 'test-locale-id',
    type: 'Locale',
    space: { sys: { type: 'Link', linkType: 'Space', id: 'test-space-id' } },
    environment: {
      sys: { type: 'Link', linkType: 'Environment', id: 'test-environment-id' },
    },
  },
};

export const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment-id',
  cmaToken: 'test-cma-token',
};
