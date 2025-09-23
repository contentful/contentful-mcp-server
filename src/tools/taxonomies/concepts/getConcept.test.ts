import { describe, it, expect, beforeEach } from 'vitest';
import { testConcept, mockConceptGet } from './mockClient.js';
import { getConceptTool } from './getConcept.js';
import { createToolClient } from '../../../utils/tools.js';
import { formatResponse } from '../../../utils/formatters.js';

describe('getConcept', () => {
  beforeEach(() => {
    mockConceptGet.mockClear();
  });

  const testArgs = {
    organizationId: 'test-org-id',
    conceptId: 'test-concept-id',
  };

  it('should retrieve a concept successfully', async () => {
    mockConceptGet.mockResolvedValue(testConcept);

    const result = await getConceptTool(testArgs);

    expect(createToolClient).toHaveBeenCalledWith({
      spaceId: 'dummy',
      environmentId: 'dummy',
    });
    expect(mockConceptGet).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptId: 'test-concept-id',
    });

    const expectedResponse = formatResponse('Concept retrieved successfully', {
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

  it('should handle errors when retrieving a concept', async () => {
    const error = new Error('Concept not found');
    mockConceptGet.mockRejectedValue(error);

    const result = await getConceptTool(testArgs);

    expect(mockConceptGet).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptId: 'test-concept-id',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error retrieving concept');
    expect(result.content[0].text).toContain('Concept not found');
  });
});
