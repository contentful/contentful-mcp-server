import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockTemplateGet,
  mockTemplatePublish,
  mockTemplate,
  mockArgs,
} from './mockClient.js';
import { publishTemplateTool } from './publishTemplate.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('publishTemplate', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads the current version then publishes with it', async () => {
    mockTemplateGet.mockResolvedValue(mockTemplate);
    mockTemplatePublish.mockResolvedValue(mockTemplate);

    const tool = publishTemplateTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });

    expect(mockTemplateGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      templateId: mockArgs.templateId,
    });
    expect(mockTemplatePublish).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      templateId: mockArgs.templateId,
      version: mockTemplate.sys.version,
    });
    expect(result.content[0].text).toContain('Template published successfully');
  });

  it('rejects a stale version', async () => {
    mockTemplateGet.mockResolvedValue(mockTemplate); // sys.version === 1

    const tool = publishTemplateTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 999 });

    expect(mockTemplatePublish).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = publishTemplateTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool({ ...mockArgs, version: 1 });
    expect(mockTemplateGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockTemplateGet.mockRejectedValue(new Error('boom'));
    const tool = publishTemplateTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });
    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error publishing template: boom' }],
    });
  });
});
