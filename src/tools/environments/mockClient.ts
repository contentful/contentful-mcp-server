import { vi } from 'vitest';

const { mockEnvironmentCreateWithId, mockCreateToolClient } = vi.hoisted(() => {
  return {
    mockEnvironmentCreateWithId: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        environment: {
          createWithId: mockEnvironmentCreateWithId,
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

export { mockEnvironmentCreateWithId, mockCreateToolClient };

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
  cmaToken: 'test-cma-token',
};
