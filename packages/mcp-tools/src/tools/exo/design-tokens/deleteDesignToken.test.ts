import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockDesignTokenGet,
  mockDesignTokenDelete,
  mockDesignToken,
  mockArgs,
} from './mockClient.js';
import { deleteDesignTokenTool } from './deleteDesignToken.js';
import { buildConfirmToken } from '../../../utils/confirmation.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('deleteDesignToken', () => {
  const mockConfig = createMockConfig();
  const validToken = buildConfirmToken(
    'designToken',
    mockArgs.designTokenId,
    mockDesignToken.sys.version,
  );

  beforeEach(() => vi.clearAllMocks());

  it('returns a confirmation preview when confirm is missing', async () => {
    mockDesignTokenGet.mockResolvedValue(mockDesignToken);

    const tool = deleteDesignTokenTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockDesignTokenDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
    expect(result.content[0].text).toContain(validToken);
  });

  it('returns a preview when the confirmToken is wrong', async () => {
    mockDesignTokenGet.mockResolvedValue(mockDesignToken);

    const tool = deleteDesignTokenTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: 'wrong',
    });

    expect(mockDesignTokenDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('deletes when confirm is true and the token matches', async () => {
    mockDesignTokenGet.mockResolvedValue(mockDesignToken);
    mockDesignTokenDelete.mockResolvedValue(undefined);

    const tool = deleteDesignTokenTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: validToken,
    });

    expect(mockDesignTokenDelete).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      designTokenId: mockArgs.designTokenId,
    });
    expect(result.content[0].text).toContain(
      'Design token deleted successfully',
    );
  });

  it('rejects deletes in a protected environment', async () => {
    const tool = deleteDesignTokenTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool(mockArgs);
    expect(mockDesignTokenGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });
});
