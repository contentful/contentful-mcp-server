import { vi } from 'vitest';

const {
  mockConceptCreate,
  mockConceptCreateWithId,
  mockConceptGet,
  mockConceptGetMany,
  mockConceptGetDescendants,
  mockConceptGetAncestors,
  mockConceptGetTotal,
  mockConceptDelete,
  mockConceptUpdatePut,
  mockCreateToolClient,
} = vi.hoisted(() => {
  return {
    mockConceptCreate: vi.fn(),
    mockConceptCreateWithId: vi.fn(),
    mockConceptGet: vi.fn(),
    mockConceptGetMany: vi.fn(),
    mockConceptGetDescendants: vi.fn(),
    mockConceptGetAncestors: vi.fn(),
    mockConceptGetTotal: vi.fn(),
    mockConceptDelete: vi.fn(),
    mockConceptUpdatePut: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        concept: {
          create: mockConceptCreate,
          createWithId: mockConceptCreateWithId,
          get: mockConceptGet,
          getMany: mockConceptGetMany,
          getDescendants: mockConceptGetDescendants,
          getAncestors: mockConceptGetAncestors,
          getTotal: mockConceptGetTotal,
          delete: mockConceptDelete,
          updatePut: mockConceptUpdatePut,
        },
      };
    }),
  };
});

vi.mock('../../../utils/tools.js', async (importOriginal) => {
  const org = await importOriginal<typeof import('../../../utils/tools.js')>();
  return {
    ...org,
    createToolClient: mockCreateToolClient,
  };
});

export {
  mockConceptCreate,
  mockConceptCreateWithId,
  mockConceptGet,
  mockConceptGetMany,
  mockConceptGetDescendants,
  mockConceptGetAncestors,
  mockConceptGetTotal,
  mockConceptDelete,
  mockConceptUpdatePut,
  mockCreateToolClient,
};

export const testConcept = {
  sys: {
    type: 'TaxonomyConcept',
    id: 'test-concept-id',
    version: 1,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    createdBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: 'user-id',
      },
    },
    updatedBy: {
      sys: {
        type: 'Link',
        linkType: 'User',
        id: 'user-id',
      },
    },
  },
  prefLabel: {
    'en-US': 'Test Concept',
  },
  uri: null,
  altLabels: {},
  hiddenLabels: {},
  definition: null,
  editorialNote: null,
  historyNote: null,
  example: null,
  note: null,
  scopeNote: null,
  notations: [],
  broader: [],
  related: [],
};

export const mockArgs = {
  organizationId: 'test-org-id',
};
