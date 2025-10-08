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
  mockCreateClient,
} = vi.hoisted(() => {
  const mockConceptCreate = vi.fn();
  const mockConceptCreateWithId = vi.fn();
  const mockConceptGet = vi.fn();
  const mockConceptGetMany = vi.fn();
  const mockConceptGetDescendants = vi.fn();
  const mockConceptGetAncestors = vi.fn();
  const mockConceptGetTotal = vi.fn();
  const mockConceptDelete = vi.fn();
  const mockConceptUpdatePut = vi.fn();
  const mockCreateClient = vi.fn(() => ({
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
  }));
  return {
    mockConceptCreate,
    mockConceptCreateWithId,
    mockConceptGet,
    mockConceptGetMany,
    mockConceptGetDescendants,
    mockConceptGetAncestors,
    mockConceptGetTotal,
    mockConceptDelete,
    mockConceptUpdatePut,
    mockCreateClient,
  };
});

vi.mock('contentful-management', () => {
  return {
    default: {
      createClient: mockCreateClient,
    },
    createClient: mockCreateClient,
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
  mockCreateClient,
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
