import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockFragmentGet,
  mockFragmentDelete,
  mockFragment,
  mockArgs,
} from './mockClient.js';
import { deleteFragmentTool } from './deleteFragment.js';
import { buildConfirmToken } from '../../../utils/confirmation.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('deleteFragment', () => {
  const mockConfig = createMockConfig();
  const validToken = buildConfirmToken(
    'fragment',
    mockArgs.fragmentId,
    mockFragment.sys.version,
  );

  beforeEach(() => vi.clearAllMocks());

  it('returns a confirmation preview when confirm is missing', async () => {
    mockFragmentGet.mockResolvedValue(mockFragment);

    const tool = deleteFragmentTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockFragmentDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
    expect(result.content[0].text).toContain(validToken);
  });

  it('returns a preview when the confirmToken is wrong', async () => {
    mockFragmentGet.mockResolvedValue(mockFragment);

    const tool = deleteFragmentTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: 'wrong',
    });

    expect(mockFragmentDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('deletes when confirm is true and the token matches', async () => {
    mockFragmentGet.mockResolvedValue(mockFragment);
    mockFragmentDelete.mockResolvedValue(undefined);

    const tool = deleteFragmentTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: validToken,
    });

    expect(mockFragmentDelete).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      fragmentId: mockArgs.fragmentId,
    });
    expect(result.content[0].text).toContain('Fragment deleted successfully');
  });

  it('rejects deletes in a protected environment', async () => {
    const tool = deleteFragmentTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool(mockArgs);
    expect(mockFragmentGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });
});
