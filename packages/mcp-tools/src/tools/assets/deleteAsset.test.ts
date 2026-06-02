import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deleteAssetTool } from './deleteAsset.js';
import { formatResponse } from '../../utils/formatters.js';
import { buildConfirmToken } from '../../utils/confirmation.js';
import {
  setupMockClient,
  mockAssetGet,
  mockAssetDelete,
  mockArgs,
  mockAsset,
} from './mockClient.js';

vi.mock('../../utils/tools.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../utils/tools.js')>();
  return {
    ...orig,
    createToolClient: vi.fn(),
  };
});
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('deleteAsset', () => {
  const mockConfig = createMockConfig();
  const validToken = buildConfirmToken(
    'asset',
    mockArgs.assetId,
    mockAsset.sys.version,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    setupMockClient();
  });

  it('returns a confirmation preview when confirm is missing', async () => {
    mockAssetGet.mockResolvedValue(mockAsset);

    const tool = deleteAssetTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockAssetDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
    expect(result.content[0].text).toContain(validToken);
  });

  it('returns a confirmation preview when confirmToken is wrong', async () => {
    mockAssetGet.mockResolvedValue(mockAsset);

    const tool = deleteAssetTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: 'wrong',
    });

    expect(mockAssetDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('returns a confirmation preview when confirm is true but confirmToken is missing', async () => {
    mockAssetGet.mockResolvedValue(mockAsset);

    const tool = deleteAssetTool(mockConfig);
    const result = await tool({ ...mockArgs, confirm: true });

    expect(mockAssetDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('returns a confirmation preview when confirm is false even with correct token', async () => {
    mockAssetGet.mockResolvedValue(mockAsset);

    const tool = deleteAssetTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: false,
      confirmToken: validToken,
    });

    expect(mockAssetDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('deletes when confirm is true and confirmToken matches', async () => {
    mockAssetGet.mockResolvedValue(mockAsset);
    mockAssetDelete.mockResolvedValue(undefined);

    const tool = deleteAssetTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: validToken,
    });

    expect(mockAssetDelete).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      assetId: mockArgs.assetId,
    });
    const expected = formatResponse('Asset deleted successfully', {
      asset: mockAsset,
    });
    expect(result).toEqual({ content: [{ type: 'text', text: expected }] });
  });

  it('handles errors when asset get fails before confirmation', async () => {
    mockAssetGet.mockRejectedValue(new Error('Asset not found'));

    const tool = deleteAssetTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockAssetDelete).not.toHaveBeenCalled();
    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error deleting asset: Asset not found' },
      ],
    });
  });

  it('handles errors when deletion fails after confirmation', async () => {
    mockAssetGet.mockResolvedValue(mockAsset);
    mockAssetDelete.mockRejectedValue(new Error('Asset deletion failed'));

    const tool = deleteAssetTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: validToken,
    });

    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error deleting asset: Asset deletion failed' },
      ],
    });
  });

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = deleteAssetTool(protectedConfig);
    const result = await tool({ ...mockArgs, environmentId: 'master' });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error deleting asset: Environment 'master' is protected. Write and delete operations are not allowed.",
        },
      ],
    });
    expect(mockAssetDelete).not.toHaveBeenCalled();
  });
});
