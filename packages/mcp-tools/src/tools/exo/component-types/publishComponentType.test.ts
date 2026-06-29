import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockComponentTypeGet,
  mockComponentTypePublish,
  mockComponentType,
  mockArgs,
} from './mockClient.js';
import { publishComponentTypeTool } from './publishComponentType.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('publishComponentType', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads the current version then publishes with it', async () => {
    mockComponentTypeGet.mockResolvedValue(mockComponentType);
    mockComponentTypePublish.mockResolvedValue(mockComponentType);

    const tool = publishComponentTypeTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockComponentTypeGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentTypeId: mockArgs.componentTypeId,
    });
    expect(mockComponentTypePublish).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentTypeId: mockArgs.componentTypeId,
      version: mockComponentType.sys.version,
    });
    expect(result.content[0].text).toContain('Component type published successfully');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = publishComponentTypeTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool(mockArgs);
    expect(mockComponentTypeGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockComponentTypeGet.mockRejectedValue(new Error('boom'));
    const tool = publishComponentTypeTool(mockConfig);
    const result = await tool(mockArgs);
    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error publishing component type: boom' }],
    });
  });
});
