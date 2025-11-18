import { describe, it, expect, beforeEach } from 'vitest';
import {
  testConceptScheme,
  testUpdatedConceptScheme,
  mockConceptSchemeUpdate,
  mockCreateClient,
} from './mockClient.js';
import { updateConceptSchemeTool } from './updateConceptScheme.js';
import { getDefaultClientConfig } from '../../../config/contentful.js';
import { formatResponse } from '../../../utils/formatters.js';

describe('updateConceptScheme', () => {
  beforeEach(() => {
    mockConceptSchemeUpdate.mockClear();
    mockCreateClient.mockClear();
  });

  const testArgs = {
    organizationId: 'test-org-id',
    conceptSchemeId: 'test-concept-scheme-id',
    version: 1,
    prefLabel: {
      'en-US': 'Updated Test Concept Scheme',
    },
  };

  it('should update a concept scheme successfully', async () => {
    mockConceptSchemeUpdate.mockResolvedValue(testUpdatedConceptScheme);

    const result = await updateConceptSchemeTool(testArgs);

    const clientConfig = getDefaultClientConfig();
    delete clientConfig.space;
    expect(mockCreateClient).toHaveBeenCalledWith(clientConfig, {
      type: 'plain',
    });

    expect(mockConceptSchemeUpdate).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
        conceptSchemeId: 'test-concept-scheme-id',
        version: 1,
      },
      [
        {
          op: 'replace',
          path: '/prefLabel',
          value: {
            'en-US': 'Updated Test Concept Scheme',
          },
        },
      ],
    );

    const expectedResponse = formatResponse(
      'Concept scheme updated successfully',
      {
        updatedConceptScheme: testUpdatedConceptScheme,
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

  it('should update multiple fields', async () => {
    const multiFieldArgs = {
      organizationId: 'test-org-id',
      conceptSchemeId: 'test-concept-scheme-id',
      version: 1,
      prefLabel: {
        'en-US': 'Updated Test Concept Scheme',
      },
      definition: {
        'en-US': 'Updated definition',
      },
      uri: 'https://example.com/updated',
    };

    mockConceptSchemeUpdate.mockResolvedValue(testUpdatedConceptScheme);

    const result = await updateConceptSchemeTool(multiFieldArgs);

    expect(mockConceptSchemeUpdate).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
        conceptSchemeId: 'test-concept-scheme-id',
        version: 1,
      },
      [
        {
          op: 'replace',
          path: '/prefLabel',
          value: {
            'en-US': 'Updated Test Concept Scheme',
          },
        },
        {
          op: 'replace',
          path: '/definition',
          value: {
            'en-US': 'Updated definition',
          },
        },
        {
          op: 'replace',
          path: '/uri',
          value: 'https://example.com/updated',
        },
      ],
    );

    const expectedResponse = formatResponse(
      'Concept scheme updated successfully',
      {
        updatedConceptScheme: testUpdatedConceptScheme,
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

  it('should handle URI removal when set to null', async () => {
    const argsWithNullUri = {
      organizationId: 'test-org-id',
      conceptSchemeId: 'test-concept-scheme-id',
      version: 1,
      uri: null,
    };

    mockConceptSchemeUpdate.mockResolvedValue(testConceptScheme);

    const result = await updateConceptSchemeTool(argsWithNullUri);

    expect(mockConceptSchemeUpdate).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
        conceptSchemeId: 'test-concept-scheme-id',
        version: 1,
      },
      [
        {
          op: 'remove',
          path: '/uri',
        },
      ],
    );

    const expectedResponse = formatResponse(
      'Concept scheme updated successfully',
      {
        updatedConceptScheme: testConceptScheme,
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

  it('should handle errors gracefully', async () => {
    const errorMessage = 'Failed to update concept scheme';
    mockConceptSchemeUpdate.mockRejectedValue(new Error(errorMessage));

    const result = await updateConceptSchemeTool(testArgs);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: `Error updating concept scheme: ${errorMessage}`,
        },
      ],
      isError: true,
    });
  });

  it('should handle empty update (no fields provided)', async () => {
    const emptyArgs = {
      organizationId: 'test-org-id',
      conceptSchemeId: 'test-concept-scheme-id',
      version: 1,
    };

    mockConceptSchemeUpdate.mockResolvedValue(testConceptScheme);

    const result = await updateConceptSchemeTool(emptyArgs);

    expect(mockConceptSchemeUpdate).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
        conceptSchemeId: 'test-concept-scheme-id',
        version: 1,
      },
      [],
    );

    const expectedResponse = formatResponse(
      'Concept scheme updated successfully',
      {
        updatedConceptScheme: testConceptScheme,
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
