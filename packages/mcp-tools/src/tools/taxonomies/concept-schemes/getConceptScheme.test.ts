import { describe, it, expect, beforeEach } from 'vitest';
import {
  testConceptScheme,
  mockConceptSchemeGet,
  mockCreateClient,
} from './mockClient.js';
import { getConceptSchemeTool } from './getConceptScheme.js';
import { getDefaultClientConfig } from '../../../config/contentful.js';
import { formatResponse } from '../../../utils/formatters.js';

describe('getConceptScheme', () => {
  beforeEach(() => {
    mockConceptSchemeGet.mockClear();
    mockCreateClient.mockClear();
  });

  const testArgs = {
    organizationId: 'test-org-id',
    conceptSchemeId: 'test-concept-scheme-id',
  };

  it('should retrieve a concept scheme successfully', async () => {
    mockConceptSchemeGet.mockResolvedValue(testConceptScheme);

    const result = await getConceptSchemeTool(testArgs);

    const clientConfig = getDefaultClientConfig();
    delete clientConfig.space;
    expect(mockCreateClient).toHaveBeenCalledWith(clientConfig, {
      type: 'plain',
    });

    expect(mockConceptSchemeGet).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptSchemeId: 'test-concept-scheme-id',
    });

    const expectedResponse = formatResponse(
      'Concept scheme retrieved successfully',
      {
        conceptScheme: testConceptScheme,
      },
    );
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });
  });

  it('should handle errors properly', async () => {
    const error = new Error('Test error');
    mockConceptSchemeGet.mockRejectedValue(error);

    const result = await getConceptSchemeTool(testArgs);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Error retrieving concept scheme: Test error',
        },
      ],
      isError: true,
    });
  });

  it('should retrieve a concept scheme with complex data', async () => {
    const complexConceptScheme = {
      ...testConceptScheme,
      prefLabel: {
        'en-US': 'Complex Concept Scheme',
        'de-DE': 'Komplexes Konzept-Schema',
      },
      uri: 'https://example.com/complex-scheme',
      definition: {
        'en-US': 'A complex concept scheme for testing',
        'de-DE': 'Ein komplexes Konzept-Schema zum Testen',
      },
      editorialNote: {
        'en-US': 'Editorial note for complex scheme',
      },
      topConcepts: [
        {
          sys: {
            type: 'Link',
            linkType: 'TaxonomyConcept',
            id: 'concept-1',
          },
        },
        {
          sys: {
            type: 'Link',
            linkType: 'TaxonomyConcept',
            id: 'concept-2',
          },
        },
      ],
    };

    mockConceptSchemeGet.mockResolvedValue(complexConceptScheme);

    const result = await getConceptSchemeTool(testArgs);

    expect(mockConceptSchemeGet).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptSchemeId: 'test-concept-scheme-id',
    });

    const expectedResponse = formatResponse(
      'Concept scheme retrieved successfully',
      {
        conceptScheme: complexConceptScheme,
      },
    );
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
