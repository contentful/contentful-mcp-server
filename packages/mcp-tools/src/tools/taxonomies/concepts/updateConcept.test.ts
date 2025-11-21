import { describe, it, expect, beforeEach } from 'vitest';
import {
  testConcept,
  mockConceptGet,
  mockConceptUpdatePut,
  mockCreateClient,
} from './mockClient.js';
import { updateConceptTool } from './updateConcept.js';
import { formatResponse } from '../../../utils/formatters.js';
import { createClientConfig } from '../../../utils/tools.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('updateConcept', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    mockConceptGet.mockClear();
    mockConceptUpdatePut.mockClear();
  });

  const testArgs = {
    organizationId: 'test-org-id',
    conceptId: 'test-concept-id',
    version: 1,
  };

  const existingConcept = {
    ...testConcept,
    prefLabel: {
      'en-US': 'Original Concept',
    },
    uri: 'https://example.com/original',
    definition: {
      'en-US': 'Original definition',
    },
    altLabels: {
      'en-US': ['Original Alt Label'],
    },
    broader: [
      {
        sys: {
          type: 'Link' as const,
          linkType: 'TaxonomyConcept' as const,
          id: 'original-broader-concept',
        },
      },
    ],
  };

  it('should update a concept successfully with partial updates', async () => {
    const updateArgs = {
      ...testArgs,
      prefLabel: {
        'en-US': 'Updated Concept',
        'de-DE': 'Aktualisiertes Konzept',
      },
      definition: {
        'en-US': 'Updated definition',
      },
    };

    const updatedConcept = {
      ...existingConcept,
      prefLabel: updateArgs.prefLabel,
      definition: updateArgs.definition,
      sys: {
        ...existingConcept.sys,
        version: 2,
        updatedAt: '2023-01-02T00:00:00Z',
      },
    };

    mockConceptGet.mockResolvedValue(existingConcept);
    mockConceptUpdatePut.mockResolvedValue(updatedConcept);

    const tool = updateConceptTool(mockConfig);
    const result = await tool(updateArgs);

    const clientConfig = createClientConfig(mockConfig);
    expect(mockCreateClient).toHaveBeenCalledWith(clientConfig, {
      type: 'plain',
    });

    expect(mockConceptGet).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptId: 'test-concept-id',
    });

    expect(mockConceptUpdatePut).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
        conceptId: 'test-concept-id',
        version: 1,
      },
      {
        prefLabel: {
          'en-US': 'Updated Concept',
          'de-DE': 'Aktualisiertes Konzept',
        },
        uri: 'https://example.com/original', // Should preserve existing
        altLabels: {
          'en-US': ['Original Alt Label'], // Should preserve existing
        },
        hiddenLabels: existingConcept.hiddenLabels,
        definition: {
          'en-US': 'Updated definition',
        },
        editorialNote: existingConcept.editorialNote,
        historyNote: existingConcept.historyNote,
        example: existingConcept.example,
        note: existingConcept.note,
        scopeNote: existingConcept.scopeNote,
        notations: existingConcept.notations,
        broader: existingConcept.broader, // Should preserve existing
        related: existingConcept.related,
      },
    );

    const expectedResponse = formatResponse('Concept updated successfully', {
      updatedConcept,
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

  it('should update a concept with all fields', async () => {
    const fullUpdateArgs = {
      ...testArgs,
      prefLabel: {
        'en-US': 'Fully Updated Concept',
      },
      uri: 'https://example.com/updated',
      altLabels: {
        'en-US': ['Updated Alt Label 1', 'Updated Alt Label 2'],
      },
      hiddenLabels: {
        'en-US': ['Updated Hidden Label'],
      },
      definition: {
        'en-US': 'Fully updated definition',
      },
      editorialNote: {
        'en-US': 'Updated editorial note',
      },
      historyNote: {
        'en-US': 'Updated history note',
      },
      example: {
        'en-US': 'Updated example',
      },
      note: {
        'en-US': 'Updated general note',
      },
      scopeNote: {
        'en-US': 'Updated scope note',
      },
      notations: ['UPN001', 'UPDATED'],
      broader: [
        {
          sys: {
            type: 'Link' as const,
            linkType: 'TaxonomyConcept' as const,
            id: 'updated-broader-concept',
          },
        },
      ],
      related: [
        {
          sys: {
            type: 'Link' as const,
            linkType: 'TaxonomyConcept' as const,
            id: 'updated-related-concept',
          },
        },
      ],
    };

    const fullyUpdatedConcept = {
      ...existingConcept,
      ...fullUpdateArgs,
      sys: {
        ...existingConcept.sys,
        version: 2,
        updatedAt: '2023-01-02T00:00:00Z',
      },
    };

    mockConceptGet.mockResolvedValue(existingConcept);
    mockConceptUpdatePut.mockResolvedValue(fullyUpdatedConcept);

    const tool = updateConceptTool(mockConfig);
    const result = await tool(fullUpdateArgs);

    expect(mockConceptUpdatePut).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
        conceptId: 'test-concept-id',
        version: 1,
      },
      {
        prefLabel: fullUpdateArgs.prefLabel,
        uri: fullUpdateArgs.uri,
        altLabels: fullUpdateArgs.altLabels,
        hiddenLabels: fullUpdateArgs.hiddenLabels,
        definition: fullUpdateArgs.definition,
        editorialNote: fullUpdateArgs.editorialNote,
        historyNote: fullUpdateArgs.historyNote,
        example: fullUpdateArgs.example,
        note: fullUpdateArgs.note,
        scopeNote: fullUpdateArgs.scopeNote,
        notations: fullUpdateArgs.notations,
        broader: fullUpdateArgs.broader,
        related: fullUpdateArgs.related,
      },
    );

    const expectedResponse = formatResponse('Concept updated successfully', {
      updatedConcept: fullyUpdatedConcept,
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

  it('should handle errors when concept update fails', async () => {
    const error = new Error('Version mismatch');
    mockConceptGet.mockResolvedValue(existingConcept);
    mockConceptUpdatePut.mockRejectedValue(error);

    const tool = updateConceptTool(mockConfig);
    const result = await tool(testArgs);

    expect(mockConceptGet).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptId: 'test-concept-id',
    });

    expect(mockConceptUpdatePut).toHaveBeenCalled();

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Error updating concept: Version mismatch',
        },
      ],
      isError: true,
    });
  });

  it('should preserve existing fields when no updates are provided', async () => {
    const minimalUpdateArgs = {
      ...testArgs,
      // Only providing required fields, no optional updates
    };

    const unchangedConcept = {
      ...existingConcept,
      sys: {
        ...existingConcept.sys,
        version: 2,
      },
    };

    mockConceptGet.mockResolvedValue(existingConcept);
    mockConceptUpdatePut.mockResolvedValue(unchangedConcept);

    const tool = updateConceptTool(mockConfig);
    const result = await tool(minimalUpdateArgs);

    expect(mockConceptUpdatePut).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
        conceptId: 'test-concept-id',
        version: 1,
      },
      {
        prefLabel: existingConcept.prefLabel, // Should preserve existing
        uri: existingConcept.uri, // Should preserve existing
        altLabels: existingConcept.altLabels, // Should preserve existing
        hiddenLabels: existingConcept.hiddenLabels,
        definition: existingConcept.definition,
        editorialNote: existingConcept.editorialNote,
        historyNote: existingConcept.historyNote,
        example: existingConcept.example,
        note: existingConcept.note,
        scopeNote: existingConcept.scopeNote,
        notations: existingConcept.notations,
        broader: existingConcept.broader, // Should preserve existing
        related: existingConcept.related,
      },
    );

    const expectedResponse = formatResponse('Concept updated successfully', {
      updatedConcept: unchangedConcept,
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
