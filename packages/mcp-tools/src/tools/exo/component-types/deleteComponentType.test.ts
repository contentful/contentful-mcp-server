import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockComponentTypeGet,
  mockComponentTypeDelete,
  mockComponentType,
  mockArgs,
} from './mockClient.js';
import { deleteComponentTypeTool } from './deleteComponentType.js';
import { buildConfirmToken } from '../../../utils/confirmation.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('deleteComponentType', () => {
  const mockConfig = createMockConfig();
  const validToken = buildConfirmToken(
    'componentType',
    mockArgs.componentTypeId,
    mockComponentType.sys.version,
  );

  beforeEach(() => vi.clearAllMocks());

  it('returns a confirmation preview when confirm is missing', async () => {
    mockComponentTypeGet.mockResolvedValue(mockComponentType);

    const tool = deleteComponentTypeTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockComponentTypeDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
    expect(result.content[0].text).toContain(validToken);
  });

  it('returns a preview when the confirmToken is wrong', async () => {
    mockComponentTypeGet.mockResolvedValue(mockComponentType);

    const tool = deleteComponentTypeTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: 'wrong',
    });

    expect(mockComponentTypeDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('deletes when confirm is true and the token matches', async () => {
    mockComponentTypeGet.mockResolvedValue(mockComponentType);
    mockComponentTypeDelete.mockResolvedValue(undefined);

    const tool = deleteComponentTypeTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: validToken,
    });

    expect(mockComponentTypeDelete).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentTypeId: mockArgs.componentTypeId,
    });
    expect(result.content[0].text).toContain(
      'Component type deleted successfully',
    );
  });

  it('rejects deletes in a protected environment', async () => {
    const tool = deleteComponentTypeTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool(mockArgs);
    expect(mockComponentTypeGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });
});
