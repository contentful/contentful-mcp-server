import { vi } from 'vitest';

const {
  mockEnvironmentCreateWithId,
  mockEnvironmentDelete,
  mockEnvironmentGet,
  mockEnvironmentGetMany,
  mockCreateToolClient,
} = vi.hoisted(() => {
  return {
    mockEnvironmentCreateWithId: vi.fn(),
    mockEnvironmentDelete: vi.fn(),
    mockEnvironmentGet: vi.fn(),
    mockEnvironmentGetMany: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        environment: {
          createWithId: mockEnvironmentCreateWithId,
          delete: mockEnvironmentDelete,
          get: mockEnvironmentGet,
          getMany: mockEnvironmentGetMany,
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
  mockEnvironmentCreateWithId,
  mockEnvironmentDelete,
  mockEnvironmentGet,
  mockEnvironmentGetMany,
  mockCreateToolClient,
};

export const testEnvironment = {
  name: 'Test Environment',
  sys: {
    id: 'test-environment-id',
    type: 'Environment',
    space: { sys: { type: 'Link', linkType: 'Space', id: 'test-space-id' } },
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
