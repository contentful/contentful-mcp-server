import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockTemplateGet, mockTemplate, mockArgs } from './mockClient.js';
import { getTemplateTool } from './getTemplate.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('getTemplate', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('retrieves a template by ID', async () => {
    mockTemplateGet.mockResolvedValue(mockTemplate);

    const tool = getTemplateTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockTemplateGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      templateId: mockArgs.templateId,
    });
    expect(result.content[0].text).toContain('Template retrieved successfully');
  });

  it('handles errors', async () => {
    mockTemplateGet.mockRejectedValue(new Error('not found'));

    const tool = getTemplateTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error retrieving template: not found' }],
    });
  });
});
