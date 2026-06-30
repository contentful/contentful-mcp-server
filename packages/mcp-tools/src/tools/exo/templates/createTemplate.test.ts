import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockTemplateCreate, mockTemplate, mockArgs } from './mockClient.js';
import { createTemplateTool } from './createTemplate.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

const createArgs = {
  ...mockArgs,
  name: 'Test Template',
  description: 'A test template',
  viewports: [],
  contentProperties: [],
  designProperties: [],
};

describe('createTemplate', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('creates a template', async () => {
    mockTemplateCreate.mockResolvedValue(mockTemplate);

    const tool = createTemplateTool(mockConfig);
    const result = await tool(createArgs);

    expect(mockTemplateCreate).toHaveBeenCalledWith(
      { spaceId: mockArgs.spaceId, environmentId: mockArgs.environmentId },
      expect.objectContaining({ name: createArgs.name }),
    );
    expect(result.content[0].text).toContain('Template created successfully');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = createTemplateTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool(createArgs);
    expect(mockTemplateCreate).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });
});
