import { vi } from 'vitest';

const {
  mockConceptCreate,
  mockConceptCreateWithId,
  mockConceptGet,
  mockConceptDelete,
  mockConceptUpdatePut,
  mockCreateToolClient,
} = vi.hoisted(() => {
  return {
    mockConceptCreate: vi.fn(),
    mockConceptCreateWithId: vi.fn(),
    mockConceptGet: vi.fn(),
    mockConceptDelete: vi.fn(),
    mockConceptUpdatePut: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        concept: {
          create: mockConceptCreate,
          createWithId: mockConceptCreateWithId,
          get: mockConceptGet,
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
