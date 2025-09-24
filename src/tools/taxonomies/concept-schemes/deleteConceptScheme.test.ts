import { describe, it, expect, beforeEach } from 'vitest';
import { mockConceptSchemeDelete, mockCreateClient } from './mockClient.js';
import { deleteConceptSchemeTool } from './deleteConceptScheme.js';
import { formatResponse } from '../../../utils/formatters.js';
import { getDefaultClientConfig } from '../../../config/contentful.js';

describe('deleteConceptScheme', () => {
  beforeEach(() => {
    mockConceptSchemeDelete.mockClear();
  });

  const testArgs = {
    organizationId: 'test-org-id',
    conceptSchemeId: 'test-concept-scheme-id',
    version: 1,
  };

  it('should delete a concept scheme successfully', async () => {
    mockConceptSchemeDelete.mockResolvedValue(undefined);

    const result = await deleteConceptSchemeTool(testArgs);

    const clientConfig = getDefaultClientConfig();
    delete clientConfig.space;
    expect(mockCreateClient).toHaveBeenCalledWith(clientConfig, {
      type: 'plain',
    });

    expect(mockConceptSchemeDelete).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptSchemeId: 'test-concept-scheme-id',
      version: 1,
    });

    const expectedResponse = formatResponse(
      'Concept scheme deleted successfully',
      {
        conceptSchemeId: 'test-concept-scheme-id',
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

  it('should handle delete error gracefully', async () => {
    const errorMessage = 'Failed to delete concept scheme';
    mockConceptSchemeDelete.mockRejectedValue(new Error(errorMessage));

    const result = await deleteConceptSchemeTool(testArgs);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: `Error deleting concept scheme: ${errorMessage}`,
        },
      ],
      isError: true,
    });
  });

  it('should handle version mismatch error gracefully', async () => {
    const versionMismatchError = new Error('Version mismatch');
    mockConceptSchemeDelete.mockRejectedValue(versionMismatchError);

    const result = await deleteConceptSchemeTool(testArgs);

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: `Error deleting concept scheme: Version mismatch`,
        },
      ],
      isError: true,
    });
  });
});
