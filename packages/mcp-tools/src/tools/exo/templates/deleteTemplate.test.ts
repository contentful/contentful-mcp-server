import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockTemplateGet,
  mockTemplateDelete,
  mockTemplate,
  mockArgs,
} from './mockClient.js';
import { deleteTemplateTool } from './deleteTemplate.js';
import { buildConfirmToken } from '../../../utils/confirmation.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('deleteTemplate', () => {
  const mockConfig = createMockConfig();
  const validToken = buildConfirmToken(
    'template',
    mockArgs.templateId,
    mockTemplate.sys.version,
  );

  beforeEach(() => vi.clearAllMocks());

  it('returns a confirmation preview when confirm is missing', async () => {
    mockTemplateGet.mockResolvedValue(mockTemplate);

    const tool = deleteTemplateTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockTemplateDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
    expect(result.content[0].text).toContain(validToken);
  });

  it('returns a preview when the confirmToken is wrong', async () => {
    mockTemplateGet.mockResolvedValue(mockTemplate);

    const tool = deleteTemplateTool(mockConfig);
    const result = await tool({ ...mockArgs, confirm: true, confirmToken: 'wrong' });

    expect(mockTemplateDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('deletes when confirm is true and the token matches', async () => {
    mockTemplateGet.mockResolvedValue(mockTemplate);
    mockTemplateDelete.mockResolvedValue(undefined);

    const tool = deleteTemplateTool(mockConfig);
    const result = await tool({ ...mockArgs, confirm: true, confirmToken: validToken });

    expect(mockTemplateDelete).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      templateId: mockArgs.templateId,
    });
    expect(result.content[0].text).toContain('Template deleted successfully');
  });

  it('rejects deletes in a protected environment', async () => {
    const tool = deleteTemplateTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool(mockArgs);
    expect(mockTemplateGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });
});
