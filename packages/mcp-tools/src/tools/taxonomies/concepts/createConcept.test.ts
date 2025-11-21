import { describe, it, expect, beforeEach } from 'vitest';
import {
  testConcept,
  mockConceptCreate,
  mockConceptCreateWithId,
  mockCreateClient,
} from './mockClient.js';
import { createConceptTool } from './createConcept.js';
import { formatResponse } from '../../../utils/formatters.js';
import { createClientConfig } from '../../../utils/tools.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('createConcept', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    mockConceptCreate.mockClear();
    mockConceptCreateWithId.mockClear();
  });

  const testArgs = {
    organizationId: 'test-org-id',
    prefLabel: {
      'en-US': 'Test Concept',
    },
  };

  it('should create a concept successfully with minimal required fields', async () => {
    mockConceptCreate.mockResolvedValue(testConcept);

    const tool = createConceptTool(mockConfig);
    const result = await tool(testArgs);

    const clientConfig = createClientConfig(mockConfig);
    expect(mockCreateClient).toHaveBeenCalledWith(clientConfig, {
      type: 'plain',
    });
    expect(mockConceptCreate).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
      },
      {
        prefLabel: {
          'en-US': 'Test Concept',
        },
      },
    );

    const expectedResponse = formatResponse('Concept created successfully', {
      newConcept: testConcept,
    });
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });
  });

  it('should create a concept successfully with all optional fields', async () => {
    const fullArgs = {
      organizationId: 'test-org-id',
      prefLabel: {
        'en-US': 'Test Concept',
        'de-DE': 'Test Konzept',
      },
      uri: 'https://example.com/concept/test',
      altLabels: {
        'en-US': ['Alternative Label 1', 'Alternative Label 2'],
        'de-DE': ['Alternatives Label 1'],
      },
      hiddenLabels: {
        'en-US': ['Hidden Label 1'],
      },
      definition: {
        'en-US': 'This is a test concept definition',
        'de-DE': 'Dies ist eine Test-Konzeptdefinition',
      },
      editorialNote: {
        'en-US': 'Editorial note for test concept',
      },
      historyNote: {
        'en-US': 'History note for test concept',
      },
      example: {
        'en-US': 'Example usage of test concept',
      },
      note: {
        'en-US': 'General note for test concept',
      },
      scopeNote: {
        'en-US': 'Scope note for test concept',
      },
      notations: ['TC001', 'TEST-CONCEPT'],
      broader: [
        {
          sys: {
            type: 'Link' as const,
            linkType: 'TaxonomyConcept' as const,
            id: 'broader-concept-id',
          },
        },
      ],
      related: [
        {
          sys: {
            type: 'Link' as const,
            linkType: 'TaxonomyConcept' as const,
            id: 'related-concept-id',
          },
        },
      ],
    };

    const fullMockConcept = {
      ...testConcept,
      prefLabel: fullArgs.prefLabel,
      uri: fullArgs.uri,
      altLabels: fullArgs.altLabels,
      hiddenLabels: fullArgs.hiddenLabels,
      definition: fullArgs.definition,
      editorialNote: fullArgs.editorialNote,
      historyNote: fullArgs.historyNote,
      example: fullArgs.example,
      note: fullArgs.note,
      scopeNote: fullArgs.scopeNote,
      notations: fullArgs.notations,
      broader: fullArgs.broader,
      related: fullArgs.related,
    };

    mockConceptCreate.mockResolvedValue(fullMockConcept);

    const tool = createConceptTool(mockConfig);
    const result = await tool(fullArgs);

    expect(mockConceptCreate).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
      },
      {
        prefLabel: fullArgs.prefLabel,
        uri: fullArgs.uri,
        altLabels: fullArgs.altLabels,
        hiddenLabels: fullArgs.hiddenLabels,
        definition: fullArgs.definition,
        editorialNote: fullArgs.editorialNote,
        historyNote: fullArgs.historyNote,
        example: fullArgs.example,
        note: fullArgs.note,
        scopeNote: fullArgs.scopeNote,
        notations: fullArgs.notations,
        broader: fullArgs.broader,
        related: fullArgs.related,
      },
    );

    const expectedResponse = formatResponse('Concept created successfully', {
      newConcept: fullMockConcept,
    });
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });
  });

  it('should handle errors when concept creation fails', async () => {
    const error = new Error('Failed to create concept');
    mockConceptCreate.mockRejectedValue(error);

    const tool = createConceptTool(mockConfig);
    const result = await tool(testArgs);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Error creating concept: Failed to create concept',
        },
      ],
      isError: true,
    });
  });

  it('should create a concept with user-defined ID successfully', async () => {
    const argsWithId = {
      ...testArgs,
      conceptId: 'my-custom-concept-id',
    };

    const conceptWithCustomId = {
      ...testConcept,
      sys: {
        ...testConcept.sys,
        id: 'my-custom-concept-id',
      },
    };

    mockConceptCreateWithId.mockResolvedValue(conceptWithCustomId);

    const tool = createConceptTool(mockConfig);
    const result = await tool(argsWithId);

    const clientConfig = createClientConfig(mockConfig);
    expect(mockCreateClient).toHaveBeenCalledWith(clientConfig, {
      type: 'plain',
    });
    expect(mockConceptCreateWithId).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
        conceptId: 'my-custom-concept-id',
      },
      {
        prefLabel: {
          'en-US': 'Test Concept',
        },
      },
    );
    expect(mockConceptCreate).not.toHaveBeenCalled();

    const expectedResponse = formatResponse('Concept created successfully', {
      newConcept: conceptWithCustomId,
    });
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });
  });

  it('should create a concept without ID using the standard create method', async () => {
    mockConceptCreate.mockResolvedValue(testConcept);

    const tool = createConceptTool(mockConfig);
    const result = await tool(testArgs);

    expect(mockConceptCreate).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
      },
      {
        prefLabel: {
          'en-US': 'Test Concept',
        },
      },
    );
    expect(mockConceptCreateWithId).not.toHaveBeenCalled();

    const expectedResponse = formatResponse('Concept created successfully', {
      newConcept: testConcept,
    });
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });
  });
});
