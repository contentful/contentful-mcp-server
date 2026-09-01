import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockDesignTokenGet,
  mockDesignTokenUpsert,
  mockDesignToken,
  mockArgs,
} from './mockClient.js';
import { upsertDesignTokenTool } from './upsertDesignToken.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('upsertDesignToken', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => vi.clearAllMocks());

  it('reads the current token before updating (read-before-write)', async () => {
    mockDesignTokenGet.mockResolvedValue(mockDesignToken);
    mockDesignTokenUpsert.mockResolvedValue({
      ...mockDesignToken,
      name: 'Renamed',
    });

    const tool = upsertDesignTokenTool(mockConfig);
    const result = await tool({ ...mockArgs, name: 'Renamed', version: 1 });

    expect(mockDesignTokenGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      designTokenId: mockArgs.designTokenId,
    });
    const [params, body] = mockDesignTokenUpsert.mock.calls[0];
    expect(params).toEqual({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      designTokenId: mockArgs.designTokenId,
    });
    expect(body.sys).toEqual({
      id: mockDesignToken.sys.id,
      type: 'DesignToken',
      version: mockDesignToken.sys.version,
    });
    expect(body.name).toBe('Renamed');
    expect(body.type).toBe(mockDesignToken.type);
    expect(result.content[0].text).toContain(
      'Design token updated successfully',
    );
  });

  it('preserves unspecified fields from the existing token', async () => {
    mockDesignTokenGet.mockResolvedValue({
      ...mockDesignToken,
      metadata: {
        tags: [{ sys: { type: 'Link', linkType: 'Tag', id: 'tag-1' } }],
      },
    });
    mockDesignTokenUpsert.mockResolvedValue(mockDesignToken);

    const tool = upsertDesignTokenTool(mockConfig);
    await tool({ ...mockArgs, name: 'Renamed', version: 1 });

    const [, body] = mockDesignTokenUpsert.mock.calls[0];
    expect(body.metadata).toEqual({
      tags: [{ sys: { type: 'Link', linkType: 'Tag', id: 'tag-1' } }],
    });
  });

  it('rejects a stale version', async () => {
    mockDesignTokenGet.mockResolvedValue(mockDesignToken); // sys.version === 1

    const tool = upsertDesignTokenTool(mockConfig);
    const result = await tool({ ...mockArgs, name: 'Renamed', version: 999 });

    expect(mockDesignTokenUpsert).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Version conflict');
  });

  it('creates a new token when version is omitted', async () => {
    mockDesignTokenUpsert.mockResolvedValue(mockDesignToken);

    const tool = upsertDesignTokenTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      name: 'New Token',
      type: 'DTCG.Color',
    });

    expect(mockDesignTokenGet).not.toHaveBeenCalled();
    expect(mockDesignTokenUpsert).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        environmentId: mockArgs.environmentId,
        designTokenId: mockArgs.designTokenId,
      },
      {
        sys: { id: mockArgs.designTokenId, type: 'DesignToken' },
        name: 'New Token',
        type: 'DTCG.Color',
      },
    );
    expect(result.content[0].text).toContain(
      'Design token created successfully',
    );
  });

  it('rejects creation when name or type is missing', async () => {
    const tool = upsertDesignTokenTool(mockConfig);
    const result = await tool({ ...mockArgs, name: 'New Token' });

    expect(mockDesignTokenUpsert).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('name and type are required');
  });

  it('rejects writes to a protected environment', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['test-environment'],
    });

    const tool = upsertDesignTokenTool(protectedConfig);
    const result = await tool({ ...mockArgs, name: 'Renamed', version: 1 });

    expect(mockDesignTokenGet).not.toHaveBeenCalled();
    expect(mockDesignTokenUpsert).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockDesignTokenGet.mockRejectedValue(new Error('not found'));

    const tool = upsertDesignTokenTool(mockConfig);
    const result = await tool({ ...mockArgs, name: 'Renamed', version: 1 });

    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error upserting design token: not found' },
      ],
    });
  });
});
