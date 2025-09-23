import { describe, it, expect, beforeEach } from 'vitest';
import {
  testConcept,
  mockConceptGet,
  mockConceptDelete,
} from './mockClient.js';
import { deleteConceptTool } from './deleteConcept.js';
import { createToolClient } from '../../../utils/tools.js';
import { formatResponse } from '../../../utils/formatters.js';

describe('deleteConcept', () => {
  beforeEach(() => {
    mockConceptGet.mockClear();
    mockConceptDelete.mockClear();
  });

  const testArgs = {
    organizationId: 'test-org-id',
    conceptId: 'test-concept-id',
    version: 1,
  };

  it('should delete a concept successfully', async () => {
    mockConceptGet.mockResolvedValue(testConcept);
    mockConceptDelete.mockResolvedValue(undefined);

    const result = await deleteConceptTool(testArgs);

    expect(createToolClient).toHaveBeenCalledWith({
      spaceId: 'dummy',
      environmentId: 'dummy',
    });

    expect(mockConceptDelete).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptId: 'test-concept-id',
      version: 1,
    });

    const expectedResponse = formatResponse('Concept deleted successfully', {
      conceptId: 'test-concept-id',
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

  it('should handle errors when concept deletion fails', async () => {
    const error = new Error('Version mismatch');
    mockConceptGet.mockResolvedValue(testConcept);
    mockConceptDelete.mockRejectedValue(error);

    const result = await deleteConceptTool(testArgs);

    expect(mockConceptDelete).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptId: 'test-concept-id',
      version: 1,
    });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Error deleting concept: Version mismatch',
        },
      ],
      isError: true,
    });
  });
});
