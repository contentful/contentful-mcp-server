import { vi } from 'vitest';

const { mockSpaceGet, mockSpaceGetMany, mockCreateClient } = vi.hoisted(() => {
  const mockSpaceGet = vi.fn();
  const mockSpaceGetMany = vi.fn();
  const mockCreateClient = vi.fn(() => ({
    space: {
      get: mockSpaceGet,
      getMany: mockSpaceGetMany,
    },
  }));
  return { mockSpaceGet, mockSpaceGetMany, mockCreateClient };
});

vi.mock('contentful-management', () => {
  return {
    default: {
      createClient: mockCreateClient,
    },
    createClient: mockCreateClient,
  };
});

export { mockSpaceGet, mockSpaceGetMany, mockCreateClient };

export const testSpace = {
  name: 'Test Space',
  sys: {
    id: 'test-space-id',
    type: 'Space',
    createdAt: '2025-08-25T10:00:00Z',
    updatedAt: '2025-08-25T10:00:00Z',
    version: 1,
  },
};

export const mockArgs = {
  spaceId: 'test-space-id',
};
