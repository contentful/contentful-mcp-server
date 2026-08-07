import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockComponentGet,
  mockComponentPublish,
  mockComponent,
  mockArgs,
} from './mockClient.js';
import { publishComponentTool } from './publishComponent.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('publishComponent', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads the current version then publishes with it', async () => {
    mockComponentGet.mockResolvedValue(mockComponent);
    mockComponentPublish.mockResolvedValue(mockComponent);

    const tool = publishComponentTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });

    expect(mockComponentGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentId: mockArgs.componentId,
    });
    expect(mockComponentPublish).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentId: mockArgs.componentId,
      version: mockComponent.sys.version,
    });
    expect(result.content[0].text).toContain(
      'Component published successfully',
    );
  });

  it('rejects a stale version', async () => {
    mockComponentGet.mockResolvedValue(mockComponent); // sys.version === 1

    const tool = publishComponentTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 999 });

    expect(mockComponentPublish).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = publishComponentTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool({ ...mockArgs, version: 1 });
    expect(mockComponentGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockComponentGet.mockRejectedValue(new Error('boom'));
    const tool = publishComponentTool(mockConfig);
    const result = await tool({ ...mockArgs, version: 1 });
    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error publishing component: boom' }],
    });
  });
});
