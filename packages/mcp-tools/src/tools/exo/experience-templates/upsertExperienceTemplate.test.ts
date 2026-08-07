import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockExperienceTemplateGet,
  mockExperienceTemplateUpsert,
  mockExperienceTemplate,
  mockArgs,
} from './mockClient.js';
import { upsertExperienceTemplateTool } from './upsertExperienceTemplate.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('upsertExperienceTemplate', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads the current experience template before updating (read-before-write)', async () => {
    mockExperienceTemplateGet.mockResolvedValue(mockExperienceTemplate);
    mockExperienceTemplateUpsert.mockResolvedValue({
      ...mockExperienceTemplate,
      name: 'Renamed',
    });

    const tool = upsertExperienceTemplateTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1, name: 'Renamed' });

    expect(mockExperienceTemplateGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceTemplateId: mockArgs.experienceTemplateId,
    });
    const [params, body] = mockExperienceTemplateUpsert.mock.calls[0];
    expect(params).toEqual({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      experienceTemplateId: mockArgs.experienceTemplateId,
    });
    expect(body.sys).toEqual({
      id: mockExperienceTemplate.sys.id,
      type: 'ExperienceTemplate',
      version: mockExperienceTemplate.sys.version,
    });
    expect(body.name).toBe('Renamed');
    expect(body.description).toBe(mockExperienceTemplate.description);
    expect(result.content[0].text).toContain(
      'Experience template updated successfully',
    );
  });

  it('preserves unspecified fields from the existing experience template', async () => {
    mockExperienceTemplateGet.mockResolvedValue({
      ...mockExperienceTemplate,
      designProperties: [{ id: 'color', name: 'Color', type: 'String' }],
    });
    mockExperienceTemplateUpsert.mockResolvedValue(mockExperienceTemplate);

    const tool = upsertExperienceTemplateTool(mockConfig);
    await tool({ ...mockArgs, version: 1, name: 'Renamed' });

    const [, body] = mockExperienceTemplateUpsert.mock.calls[0];
    expect(body.designProperties).toEqual([
      { id: 'color', name: 'Color', type: 'String' },
    ]);
  });

  it('preserves dataAssemblies from the existing experience template', async () => {
    const dataAssemblies = [
      { sys: { id: 'da-1', type: 'Link', linkType: 'DataAssembly' } },
    ];
    mockExperienceTemplateGet.mockResolvedValue({
      ...mockExperienceTemplate,
      dataAssemblies,
    });
    mockExperienceTemplateUpsert.mockResolvedValue(mockExperienceTemplate);

    const tool = upsertExperienceTemplateTool(mockConfig);
    await tool({ ...mockArgs, version: 1, name: 'Renamed' });

    const [, body] = mockExperienceTemplateUpsert.mock.calls[0];
    expect(body.dataAssemblies).toEqual(dataAssemblies);
  });

  it('rejects a stale version', async () => {
    mockExperienceTemplateGet.mockResolvedValue(mockExperienceTemplate); // sys.version === 1

    const tool = upsertExperienceTemplateTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 999, name: 'New Name' });

    expect(mockExperienceTemplateUpsert).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = upsertExperienceTemplateTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool({ ...mockArgs, version: 1, name: 'New Name' });
    expect(mockExperienceTemplateGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockExperienceTemplateGet.mockRejectedValue(new Error('not found'));

    const tool = upsertExperienceTemplateTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1, name: 'Renamed' });

    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error updating experience template: not found' },
      ],
    });
  });
});
