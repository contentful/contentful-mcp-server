import { describe, it, expect, beforeEach } from 'vitest';
import { testConcept, mockConceptGet, mockCreateClient } from './mockClient.js';
import { getConceptTool } from './getConcept.js';
import { formatResponse } from '../../../utils/formatters.js';
import { getDefaultClientConfig } from '../../../config/contentful.js';

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

    const clientConfig = getDefaultClientConfig();
    delete clientConfig.space;
    expect(mockCreateClient).toHaveBeenCalledWith(clientConfig, {
      type: 'plain',
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
