import { vi } from 'vitest';

const { mockTagCreateWithId, mockTagGetMany, mockCreateToolClient } =
  vi.hoisted(() => {
    return {
      mockTagCreateWithId: vi.fn(),
      mockTagGetMany: vi.fn(),
      mockCreateToolClient: vi.fn(() => {
        return {
          tag: {
            createWithId: mockTagCreateWithId,
            getMany: mockTagGetMany,
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

export { mockTagCreateWithId, mockTagGetMany, mockCreateToolClient };

export const testTag = {
  name: 'Test Tag',
  sys: {
    id: 'test-tag-id',
    type: 'Tag',
    visibility: 'public',
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
