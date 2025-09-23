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

    expect(mockConceptGet).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptId: 'test-concept-id',
    });

    expect(mockConceptDelete).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptId: 'test-concept-id',
      version: 1,
    });

    const expectedResponse = formatResponse('Concept deleted successfully', {
      concept: testConcept,
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

  it('should handle errors when concept retrieval fails', async () => {
    const error = new Error('Concept not found');
    mockConceptGet.mockRejectedValue(error);

    const result = await deleteConceptTool(testArgs);

    expect(mockConceptGet).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptId: 'test-concept-id',
    });

    expect(mockConceptDelete).not.toHaveBeenCalled();

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Error deleting concept: Concept not found',
        },
      ],
      isError: true,
    });
  });

  it('should handle errors when concept deletion fails', async () => {
    const error = new Error('Version mismatch');
    mockConceptGet.mockResolvedValue(testConcept);
    mockConceptDelete.mockRejectedValue(error);

    const result = await deleteConceptTool(testArgs);

    expect(mockConceptGet).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptId: 'test-concept-id',
    });

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

  it('should delete a concept with different version number', async () => {
    const argsWithDifferentVersion = {
      ...testArgs,
      version: 5,
    };

    const conceptWithDifferentVersion = {
      ...testConcept,
      sys: {
        ...testConcept.sys,
        version: 5,
      },
    };

    mockConceptGet.mockResolvedValue(conceptWithDifferentVersion);
    mockConceptDelete.mockResolvedValue(undefined);

    const result = await deleteConceptTool(argsWithDifferentVersion);

    expect(mockConceptGet).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptId: 'test-concept-id',
    });

    expect(mockConceptDelete).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptId: 'test-concept-id',
      version: 5,
    });

    const expectedResponse = formatResponse('Concept deleted successfully', {
      concept: conceptWithDifferentVersion,
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

  it('should delete a concept with different concept ID', async () => {
    const argsWithDifferentId = {
      ...testArgs,
      conceptId: 'different-concept-id',
    };

    const conceptWithDifferentId = {
      ...testConcept,
      sys: {
        ...testConcept.sys,
        id: 'different-concept-id',
      },
    };

    mockConceptGet.mockResolvedValue(conceptWithDifferentId);
    mockConceptDelete.mockResolvedValue(undefined);

    const result = await deleteConceptTool(argsWithDifferentId);

    expect(mockConceptGet).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptId: 'different-concept-id',
    });

    expect(mockConceptDelete).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptId: 'different-concept-id',
      version: 1,
    });

    const expectedResponse = formatResponse('Concept deleted successfully', {
      concept: conceptWithDifferentId,
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
