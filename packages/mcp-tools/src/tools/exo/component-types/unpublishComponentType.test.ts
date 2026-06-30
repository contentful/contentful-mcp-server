import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockComponentTypeGet,
  mockComponentTypeUnpublish,
  mockComponentType,
  mockArgs,
} from './mockClient.js';
import { unpublishComponentTypeTool } from './unpublishComponentType.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('unpublishComponentType', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads the current version then unpublishes with it', async () => {
    mockComponentTypeGet.mockResolvedValue(mockComponentType);
    mockComponentTypeUnpublish.mockResolvedValue(mockComponentType);

    const tool = unpublishComponentTypeTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });

    expect(mockComponentTypeGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentTypeId: mockArgs.componentTypeId,
    });
    expect(mockComponentTypeUnpublish).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentTypeId: mockArgs.componentTypeId,
      version: mockComponentType.sys.version,
    });
    expect(result.content[0].text).toContain(
      'Component type unpublished successfully',
    );
  });

  it('rejects a stale version', async () => {
    mockComponentTypeGet.mockResolvedValue(mockComponentType); // sys.version === 1

    const tool = unpublishComponentTypeTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 999 });

    expect(mockComponentTypeUnpublish).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = unpublishComponentTypeTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool({ ...mockArgs, version: 1 });
    expect(mockComponentTypeGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockComponentTypeGet.mockRejectedValue(new Error('boom'));
    const tool = unpublishComponentTypeTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });
    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error unpublishing component type: boom' },
      ],
    });
  });
});
