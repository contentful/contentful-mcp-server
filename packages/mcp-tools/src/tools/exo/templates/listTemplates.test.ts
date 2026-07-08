import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockTemplateGetMany,
  mockTemplatesResponse,
  mockArgs,
} from './mockClient.js';
import { listTemplatesTool } from './listTemplates.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('listTemplates', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('lists templates with default limit', async () => {
    mockTemplateGetMany.mockResolvedValue(mockTemplatesResponse);

    const tool = listTemplatesTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockTemplateGetMany).toHaveBeenCalledWith(
      expect.objectContaining({
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
      }),
    );
    expect(result.content[0].text).toContain('Templates retrieved successfully');
  });

  it('passes pageNext cursor when provided', async () => {
    mockTemplateGetMany.mockResolvedValue(mockTemplatesResponse);

    const tool = listTemplatesTool(mockConfig);
    await tool({ ...mockArgs, pageNext: 'some-cursor' });

    expect(mockTemplateGetMany).toHaveBeenCalledWith(
      expect.objectContaining({
        query: expect.objectContaining({ pageNext: 'some-cursor' }),
      }),
    );
  });

  it('handles errors', async () => {
    mockTemplateGetMany.mockRejectedValue(new Error('boom'));

    const tool = listTemplatesTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error listing templates: boom' }],
    });
  });
});
