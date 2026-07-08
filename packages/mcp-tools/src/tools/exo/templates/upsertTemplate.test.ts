import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockTemplateGet,
  mockTemplateUpsert,
  mockTemplate,
  mockArgs,
} from './mockClient.js';
import { upsertTemplateTool } from './upsertTemplate.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('upsertTemplate', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads the current template before updating (read-before-write)', async () => {
    mockTemplateGet.mockResolvedValue(mockTemplate);
    mockTemplateUpsert.mockResolvedValue({ ...mockTemplate, name: 'Renamed' });

    const tool = upsertTemplateTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1, name: 'Renamed' });

    expect(mockTemplateGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      templateId: mockArgs.templateId,
    });
    const [params, body] = mockTemplateUpsert.mock.calls[0];
    expect(params).toEqual({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      templateId: mockArgs.templateId,
    });
    expect(body.sys).toEqual({
      id: mockTemplate.sys.id,
      type: 'Template',
      version: mockTemplate.sys.version,
    });
    expect(body.name).toBe('Renamed');
    expect(body.description).toBe(mockTemplate.description);
    expect(result.content[0].text).toContain('Template updated successfully');
  });

  it('preserves unspecified fields from the existing template', async () => {
    mockTemplateGet.mockResolvedValue({
      ...mockTemplate,
      designProperties: [{ id: 'color', name: 'Color', type: 'String' }],
    });
    mockTemplateUpsert.mockResolvedValue(mockTemplate);

    const tool = upsertTemplateTool(mockConfig);
    await tool({ ...mockArgs, version: 1, name: 'Renamed' });

    const [, body] = mockTemplateUpsert.mock.calls[0];
    expect(body.designProperties).toEqual([
      { id: 'color', name: 'Color', type: 'String' },
    ]);
  });

  it('preserves dataAssemblies from the existing template', async () => {
    const dataAssemblies = [
      { sys: { id: 'da-1', type: 'Link', linkType: 'DataAssembly' } },
    ];
    mockTemplateGet.mockResolvedValue({ ...mockTemplate, dataAssemblies });
    mockTemplateUpsert.mockResolvedValue(mockTemplate);

    const tool = upsertTemplateTool(mockConfig);
    await tool({ ...mockArgs, version: 1, name: 'Renamed' });

    const [, body] = mockTemplateUpsert.mock.calls[0];
    expect(body.dataAssemblies).toEqual(dataAssemblies);
  });

  it('rejects a stale version', async () => {
    mockTemplateGet.mockResolvedValue(mockTemplate); // sys.version === 1

    const tool = upsertTemplateTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 999, name: 'New Name' });

    expect(mockTemplateUpsert).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = upsertTemplateTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool({ ...mockArgs, version: 1, name: 'New Name' });
    expect(mockTemplateGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockTemplateGet.mockRejectedValue(new Error('not found'));

    const tool = upsertTemplateTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1, name: 'Renamed' });

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error updating template: not found' }],
    });
  });
});
