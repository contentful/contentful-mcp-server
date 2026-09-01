import { vi } from 'vitest';

/**
 * Shared mock objects for DesignToken tests.
 * Mirrors the components mockClient pattern, adapted to the ExO
 * design token plain client API (get, getMany, upsert, delete — no
 * create/publish/unpublish).
 */
const {
  mockDesignTokenGet,
  mockDesignTokenGetMany,
  mockDesignTokenUpsert,
  mockDesignTokenDelete,
  mockCreateToolClient,
} = vi.hoisted(() => {
  return {
    mockDesignTokenGet: vi.fn(),
    mockDesignTokenGetMany: vi.fn(),
    mockDesignTokenUpsert: vi.fn(),
    mockDesignTokenDelete: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        designToken: {
          get: mockDesignTokenGet,
          getMany: mockDesignTokenGetMany,
          upsert: mockDesignTokenUpsert,
          delete: mockDesignTokenDelete,
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
  mockDesignTokenGet,
  mockDesignTokenGetMany,
  mockDesignTokenUpsert,
  mockDesignTokenDelete,
  mockCreateToolClient,
};

/**
 * Standard mock DesignToken object used across tests.
 */
export const mockDesignToken = {
  sys: {
    id: 'test-design-token-id',
    type: 'DesignToken' as const,
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
  name: 'Test Design Token',
  type: 'DTCG.Color' as const,
};

/**
 * Standard test arguments for design token operations.
 */
export const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  designTokenId: 'test-design-token-id',
};

/**
 * Mock cursor-paginated list response.
 */
export const mockDesignTokensResponse = {
  sys: { type: 'Array' as const },
  total: 2,
  limit: 10,
  items: [
    mockDesignToken,
    {
      ...mockDesignToken,
      sys: { ...mockDesignToken.sys, id: 'another-design-token' },
      name: 'Another Design Token',
    },
  ],
  pages: { next: 'next-cursor-token' },
};
