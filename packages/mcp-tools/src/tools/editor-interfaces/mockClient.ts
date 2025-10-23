import { vi } from 'vitest';

/**
 * Shared mock objects for editor interface tests
 * Provides standardized mock client and editor interface objects used across all editor interface tests
 */
const {
  mockEditorInterfaceGet,
  mockEditorInterfaceGetMany,
  mockEditorInterfaceUpdate,
  mockCreateToolClient,
} = vi.hoisted(() => {
  return {
    mockEditorInterfaceGet: vi.fn(),
    mockEditorInterfaceGetMany: vi.fn(),
    mockEditorInterfaceUpdate: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        editorInterface: {
          get: mockEditorInterfaceGet,
          getMany: mockEditorInterfaceGetMany,
          update: mockEditorInterfaceUpdate,
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
  mockEditorInterfaceGet,
  mockEditorInterfaceGetMany,
  mockEditorInterfaceUpdate,
  mockCreateToolClient,
};

/**
 * Standard mock editor interface object used across tests
 */
export const mockEditorInterface = {
  sys: {
    id: 'default',
    type: 'EditorInterface' as const,
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
    contentType: {
      sys: {
        type: 'Link' as const,
        linkType: 'ContentType' as const,
        id: 'test-content-type-id',
      },
    },
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  controls: [
    {
      fieldId: 'title',
      widgetId: 'singleLine',
      widgetNamespace: 'builtin' as const,
    },
    {
      fieldId: 'description',
      widgetId: 'markdown',
      widgetNamespace: 'builtin' as const,
    },
  ],
  sidebar: [
    {
      widgetId: 'publication-widget',
      widgetNamespace: 'sidebar-builtin' as const,
    },
    {
      widgetId: 'content-preview-widget',
      widgetNamespace: 'sidebar-builtin' as const,
    },
  ],
};

/**
 * Standard test arguments for editor interface operations
 */
export const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  contentTypeId: 'test-content-type-id',
};

/**
 * Mock editor interfaces list response
 */
export const mockEditorInterfacesResponse = {
  total: 2,
  skip: 0,
  limit: 100,
  items: [
    mockEditorInterface,
    {
      ...mockEditorInterface,
      sys: {
        ...mockEditorInterface.sys,
        contentType: {
          sys: {
            type: 'Link' as const,
            linkType: 'ContentType' as const,
            id: 'another-content-type',
          },
        },
      },
    },
  ],
};
