import { describe, it, expect, beforeEach } from 'vitest';
import {
  testConceptScheme,
  mockConceptSchemeGet,
  mockConceptSchemeDelete,
} from './mockClient.js';
import { deleteConceptSchemeTool } from './deleteConceptScheme.js';
import { createToolClient } from '../../../utils/tools.js';
import { formatResponse } from '../../../utils/formatters.js';

describe('deleteConceptScheme', () => {
  beforeEach(() => {
    mockConceptSchemeGet.mockClear();
    mockConceptSchemeDelete.mockClear();
  });

  const testArgs = {
    organizationId: 'test-org-id',
    conceptSchemeId: 'test-concept-scheme-id',
    version: 1,
  };

  it('should delete a concept scheme successfully', async () => {
    mockConceptSchemeGet.mockResolvedValue(testConceptScheme);
    mockConceptSchemeDelete.mockResolvedValue(undefined);

    const result = await deleteConceptSchemeTool(testArgs);

    expect(createToolClient).toHaveBeenCalledWith({
      spaceId: 'dummy',
      environmentId: 'dummy',
    });

    // Should first get the concept scheme
    expect(mockConceptSchemeGet).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptSchemeId: 'test-concept-scheme-id',
    });

    // Then delete it
    expect(mockConceptSchemeDelete).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptSchemeId: 'test-concept-scheme-id',
      version: 1,
    });

    const expectedResponse = formatResponse(
      'Concept scheme deleted successfully',
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

  it('should handle get error gracefully', async () => {
    const errorMessage = 'Concept scheme not found';
    mockConceptSchemeGet.mockRejectedValue(new Error(errorMessage));

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

    // Should not attempt to delete if get fails
    expect(mockConceptSchemeDelete).not.toHaveBeenCalled();
  });

  it('should handle delete error gracefully', async () => {
    const errorMessage = 'Failed to delete concept scheme';
    mockConceptSchemeGet.mockResolvedValue(testConceptScheme);
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
    mockConceptSchemeGet.mockResolvedValue(testConceptScheme);
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
