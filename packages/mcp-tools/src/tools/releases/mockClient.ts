import { vi } from 'vitest';
import { createToolClient } from '../../utils/tools.js';

/**
 * Shared mock objects for release tests
 * Provides standardized mock client and release objects used across all release tests
 */

export const mockReleaseGet = vi.fn();
export const mockReleaseQuery = vi.fn();
export const mockReleaseCreate = vi.fn();
export const mockReleaseUpdate = vi.fn();
export const mockReleaseDelete = vi.fn();
export const mockReleasePublish = vi.fn();
export const mockReleaseUnpublish = vi.fn();
export const mockReleaseValidate = vi.fn();

export const mockReleaseActionGet = vi.fn();
export const mockReleaseActionGetMany = vi.fn();

export const mockScheduledActionGet = vi.fn();
export const mockScheduledActionGetMany = vi.fn();
export const mockScheduledActionCreate = vi.fn();
export const mockScheduledActionUpdate = vi.fn();
export const mockScheduledActionDelete = vi.fn();

/**
 * Standard mock Contentful client with all release operations
 */
export const mockClient = {
  release: {
    get: mockReleaseGet,
    query: mockReleaseQuery,
    create: mockReleaseCreate,
    update: mockReleaseUpdate,
    delete: mockReleaseDelete,
    publish: mockReleasePublish,
    unpublish: mockReleaseUnpublish,
    validate: mockReleaseValidate,
  },
  releaseAction: {
    get: mockReleaseActionGet,
    getMany: mockReleaseActionGetMany,
  },
  scheduledActions: {
    get: mockScheduledActionGet,
    getMany: mockScheduledActionGetMany,
    create: mockScheduledActionCreate,
    update: mockScheduledActionUpdate,
    delete: mockScheduledActionDelete,
  },
};

/**
 * Sets up the mock client for tests
 * Call this in beforeEach to ensure the mock is properly configured
 */
export function setupMockClient() {
  vi.mocked(createToolClient).mockReturnValue(
    mockClient as unknown as ReturnType<typeof createToolClient>,
  );
}

/**
 * Standard test arguments for release operations
 */
export const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  releaseId: 'test-release-id',
};

/**
 * Standard mock release object used across tests
 */
export const mockRelease = {
  sys: {
    id: 'test-release-id',
    type: 'Release' as const,
    version: 1,
    status: 'active' as const,
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
    createdBy: {
      sys: {
        type: 'Link' as const,
        linkType: 'User' as const,
        id: 'test-user-id',
      },
    },
    updatedBy: {
      sys: {
        type: 'Link' as const,
        linkType: 'User' as const,
        id: 'test-user-id',
      },
    },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  title: 'Test Release',
  entities: {
    sys: { type: 'Array' as const },
    items: [
      {
        sys: {
          type: 'Link' as const,
          linkType: 'Entry' as const,
          id: 'test-entry-id',
        },
      },
    ],
  },
};

/**
 * Mock release action object used across tests
 */
export const mockReleaseAction = {
  action: 'publish' as const,
  sys: {
    id: 'test-release-action-id',
    type: 'ReleaseAction' as const,
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
    release: {
      sys: {
        type: 'Link' as const,
        linkType: 'Release' as const,
        id: 'test-release-id',
      },
    },
    status: 'created' as const,
    createdBy: {
      sys: {
        type: 'Link' as const,
        linkType: 'User' as const,
        id: 'test-user-id',
      },
    },
    updatedBy: {
      sys: {
        type: 'Link' as const,
        linkType: 'User' as const,
        id: 'test-user-id',
      },
    },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
};

/**
 * Mock releases list response (cursor-paginated)
 */
export const mockReleasesResponse = {
  sys: { type: 'Array' as const },
  items: [
    mockRelease,
    {
      ...mockRelease,
      sys: { ...mockRelease.sys, id: 'another-release-id' },
      title: 'Another Test Release',
    },
  ],
  pages: {},
};

/**
 * Mock release actions list response
 */
export const mockReleaseActionsResponse = {
  sys: { type: 'Array' as const },
  total: 2,
  skip: 0,
  limit: 100,
  items: [
    mockReleaseAction,
    {
      ...mockReleaseAction,
      sys: { ...mockReleaseAction.sys, id: 'another-release-action-id' },
      action: 'validate' as const,
    },
  ],
};

export const mockScheduledAction = {
  sys: {
    id: 'test-scheduled-action-id',
    type: 'ScheduledAction' as const,
    version: 1,
    status: 'scheduled' as const,
    space: {
      sys: {
        type: 'Link' as const,
        linkType: 'Space' as const,
        id: 'test-space-id',
      },
    },
    createdBy: {
      sys: {
        type: 'Link' as const,
        linkType: 'User' as const,
        id: 'test-user-id',
      },
    },
    updatedBy: {
      sys: {
        type: 'Link' as const,
        linkType: 'User' as const,
        id: 'test-user-id',
      },
    },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  action: 'publish' as const,
  entity: {
    sys: {
      type: 'Link' as const,
      linkType: 'Release' as const,
      id: mockArgs.releaseId,
    },
  },
  environment: {
    sys: {
      type: 'Link' as const,
      linkType: 'Environment' as const,
      id: mockArgs.environmentId,
    },
  },
  scheduledFor: {
    datetime: '2026-01-01T00:00:00Z',
    timezone: 'UTC',
  },
};

export const mockScheduledActionsResponse = {
  sys: { type: 'Array' as const },
  items: [
    mockScheduledAction,
    {
      ...mockScheduledAction,
      sys: { ...mockScheduledAction.sys, id: 'another-scheduled-action-id' },
      action: 'unpublish' as const,
    },
  ],
  pages: {},
};
