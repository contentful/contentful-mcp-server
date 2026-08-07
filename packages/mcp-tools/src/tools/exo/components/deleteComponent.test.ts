import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockComponentGet,
  mockComponentDelete,
  mockComponent,
  mockArgs,
} from './mockClient.js';
import { deleteComponentTool } from './deleteComponent.js';
import { buildConfirmToken } from '../../../utils/confirmation.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('deleteComponent', () => {
  const mockConfig = createMockConfig();
  const validToken = buildConfirmToken(
    'component',
    mockArgs.componentId,
    mockComponent.sys.version,
  );

  beforeEach(() => vi.clearAllMocks());

  it('returns a confirmation preview when confirm is missing', async () => {
    mockComponentGet.mockResolvedValue(mockComponent);

    const tool = deleteComponentTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockComponentDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
    expect(result.content[0].text).toContain(validToken);
  });

  it('returns a preview when the confirmToken is wrong', async () => {
    mockComponentGet.mockResolvedValue(mockComponent);

    const tool = deleteComponentTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: 'wrong',
    });

    expect(mockComponentDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('deletes when confirm is true and the token matches', async () => {
    mockComponentGet.mockResolvedValue(mockComponent);
    mockComponentDelete.mockResolvedValue(undefined);

    const tool = deleteComponentTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: validToken,
    });

    expect(mockComponentDelete).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentId: mockArgs.componentId,
    });
    expect(result.content[0].text).toContain('Component deleted successfully');
  });

  it('rejects deletes in a protected environment', async () => {
    const tool = deleteComponentTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool(mockArgs);
    expect(mockComponentGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });
});
