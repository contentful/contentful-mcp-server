import { vi } from 'vitest';

const {
  mockConceptSchemeCreate,
  mockConceptSchemeCreateWithId,
  mockConceptSchemeGet,
  mockConceptSchemeGetMany,
  mockConceptSchemeUpdate,
  mockConceptSchemeDelete,
  mockCreateToolClient,
} = vi.hoisted(() => {
  return {
    mockConceptSchemeCreate: vi.fn(),
    mockConceptSchemeCreateWithId: vi.fn(),
    mockConceptSchemeGet: vi.fn(),
    mockConceptSchemeGetMany: vi.fn(),
    mockConceptSchemeUpdate: vi.fn(),
    mockConceptSchemeDelete: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        conceptScheme: {
          create: mockConceptSchemeCreate,
          createWithId: mockConceptSchemeCreateWithId,
          get: mockConceptSchemeGet,
          getMany: mockConceptSchemeGetMany,
          update: mockConceptSchemeUpdate,
          delete: mockConceptSchemeDelete,
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
  mockConceptSchemeCreate,
  mockConceptSchemeCreateWithId,
  mockConceptSchemeGet,
  mockConceptSchemeGetMany,
  mockConceptSchemeUpdate,
  mockConceptSchemeDelete,
  mockCreateToolClient,
};

export const testConceptScheme = {
  sys: {
    type: 'TaxonomyConceptScheme',
    id: 'test-concept-scheme-id',
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
    'en-US': 'Test Concept Scheme',
  },
  uri: null,
  definition: null,
  editorialNote: null,
  historyNote: null,
  example: null,
  note: null,
  scopeNote: null,
  topConcepts: [],
};

export const testConceptScheme1 = {
  sys: {
    type: 'TaxonomyConceptScheme',
    id: 'concept-scheme-1',
    version: 1,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  prefLabel: {
    'en-US': 'First Concept Scheme',
  },
  uri: null,
  definition: {
    'en-US': 'First concept scheme for testing',
  },
  topConcepts: [],
};

export const testConceptScheme2 = {
  sys: {
    type: 'TaxonomyConceptScheme',
    id: 'concept-scheme-2',
    version: 2,
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
  },
  prefLabel: {
    'en-US': 'Second Concept Scheme',
  },
  uri: 'https://example.com/schemes/second',
  definition: {
    'en-US': 'Second concept scheme for testing',
  },
  topConcepts: [
    {
      sys: {
        type: 'Link',
        linkType: 'TaxonomyConcept',
        id: 'concept-1',
      },
    },
  ],
};

export const testUpdatedConceptScheme = {
  sys: {
    type: 'TaxonomyConceptScheme',
    id: 'test-concept-scheme-id',
    version: 2,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T12:00:00Z',
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
    'en-US': 'Updated Test Concept Scheme',
  },
  uri: 'https://example.com/updated',
  definition: {
    'en-US': 'Updated definition',
  },
  editorialNote: null,
  historyNote: null,
  example: null,
  note: null,
  scopeNote: null,
  topConcepts: [],
};

export const mockArgs = {
  organizationId: 'test-org-id',
};
