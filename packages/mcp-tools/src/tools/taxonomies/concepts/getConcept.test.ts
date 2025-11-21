import { describe, it, expect, beforeEach } from 'vitest';
import { testConcept, mockConceptGet, mockCreateClient } from './mockClient.js';
import { getConceptTool } from './getConcept.js';
import { formatResponse } from '../../../utils/formatters.js';
import { createClientConfig } from '../../../utils/tools.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('getConcept', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    mockConceptGet.mockClear();
  });

  const testArgs = {
    organizationId: 'test-org-id',
    conceptId: 'test-concept-id',
  };

  it('should retrieve a concept successfully', async () => {
    mockConceptGet.mockResolvedValue(testConcept);

    const tool = getConceptTool(mockConfig);
    const result = await tool(testArgs);

    const clientConfig = createClientConfig(mockConfig);
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

    const tool = getConceptTool(mockConfig);
    const result = await tool(testArgs);

    expect(mockConceptGet).toHaveBeenCalledWith({
      organizationId: 'test-org-id',
      conceptId: 'test-concept-id',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error retrieving concept');
    expect(result.content[0].text).toContain('Concept not found');
  });
});
