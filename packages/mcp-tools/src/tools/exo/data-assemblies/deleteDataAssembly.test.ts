import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockDataAssemblyGet,
  mockDataAssemblyDelete,
  mockDataAssembly,
  mockArgs,
} from './mockClient.js';
import { deleteDataAssemblyTool } from './deleteDataAssembly.js';
import { buildConfirmToken } from '../../../utils/confirmation.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('deleteDataAssembly', () => {
  const mockConfig = createMockConfig();
  const validToken = buildConfirmToken(
    'dataAssembly',
    mockArgs.dataAssemblyId,
    mockDataAssembly.sys.version,
  );

  beforeEach(() => vi.clearAllMocks());

  it('returns a confirmation preview when confirm is missing', async () => {
    mockDataAssemblyGet.mockResolvedValue(mockDataAssembly);

    const tool = deleteDataAssemblyTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockDataAssemblyDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
    expect(result.content[0].text).toContain(validToken);
  });

  it('returns a preview when the confirmToken is wrong', async () => {
    mockDataAssemblyGet.mockResolvedValue(mockDataAssembly);

    const tool = deleteDataAssemblyTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: 'wrong',
    });

    expect(mockDataAssemblyDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('deletes when confirm is true and the token matches', async () => {
    mockDataAssemblyGet.mockResolvedValue(mockDataAssembly);
    mockDataAssemblyDelete.mockResolvedValue(undefined);

    const tool = deleteDataAssemblyTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: validToken,
    });

    expect(mockDataAssemblyDelete).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      dataAssemblyId: mockArgs.dataAssemblyId,
    });
    expect(result.content[0].text).toContain('Data assembly deleted successfully');
  });

  it('rejects deletes in a protected environment', async () => {
    const tool = deleteDataAssemblyTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool(mockArgs);
    expect(mockDataAssemblyGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });
});
