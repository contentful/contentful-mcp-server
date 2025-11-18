import { vi } from 'vitest';

const { mockOrgGet, mockOrgGetAll, mockCreateClient } = vi.hoisted(() => {
  const mockOrgGet = vi.fn();
  const mockOrgGetAll = vi.fn();
  const mockCreateClient = vi.fn(() => ({
    organization: {
      get: mockOrgGet,
      getAll: mockOrgGetAll,
    },
  }));
  return { mockOrgGet, mockOrgGetAll, mockCreateClient };
});

vi.mock('contentful-management', () => {
  return {
    default: {
      createClient: mockCreateClient,
    },
    createClient: mockCreateClient,
  };
});

export { mockOrgGet, mockOrgGetAll, mockCreateClient };

export const testOrg = {
  name: 'Test Organization',
  sys: {
    id: 'test-org-id',
    type: 'Organization',
    createdAt: '2025-08-25T10:00:00Z',
    updatedAt: '2025-08-25T10:00:00Z',
    version: 1,
    accessPolicy: {
      sso: false,
    },
  },
};

export const mockArgs = {
  organizationId: 'test-org-id',
};
