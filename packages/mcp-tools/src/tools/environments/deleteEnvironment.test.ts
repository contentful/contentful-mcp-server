import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockArgs,
  mockEnvironmentDelete,
  mockEnvironmentGet,
  testEnvironment,
} from './mockClient.js';
import { deleteEnvironmentTool } from './deleteEnvironment.js';
import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';
import { buildConfirmToken } from '../../utils/confirmation.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('deleteEnvironment', () => {
  const mockConfig = createMockConfig();
  const targetEnv = 'env-to-delete';
  const validToken = buildConfirmToken(
    'environment',
    targetEnv,
    testEnvironment.sys.version,
  );
  const targetEnvironment = {
    ...testEnvironment,
    sys: { ...testEnvironment.sys, id: targetEnv },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a confirmation preview when confirm is missing', async () => {
    mockEnvironmentGet.mockResolvedValue(targetEnvironment);

    const tool = deleteEnvironmentTool(mockConfig);
    const result = await tool({ ...mockArgs, environmentId: targetEnv });

    expect(mockEnvironmentDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
    expect(result.content[0].text).toContain(validToken);
  });

  it('returns a confirmation preview when confirmToken is wrong', async () => {
    mockEnvironmentGet.mockResolvedValue(targetEnvironment);

    const tool = deleteEnvironmentTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      environmentId: targetEnv,
      confirm: true,
      confirmToken: 'wrong',
    });

    expect(mockEnvironmentDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('returns a confirmation preview when confirm is true but confirmToken is missing', async () => {
    mockEnvironmentGet.mockResolvedValue(targetEnvironment);

    const tool = deleteEnvironmentTool(mockConfig);
    const result = await tool({ ...mockArgs, environmentId: targetEnv, confirm: true });

    expect(mockEnvironmentDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('returns a confirmation preview when confirm is false even with correct token', async () => {
    mockEnvironmentGet.mockResolvedValue(targetEnvironment);

    const tool = deleteEnvironmentTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      environmentId: targetEnv,
      confirm: false,
      confirmToken: validToken,
    });

    expect(mockEnvironmentDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('deletes when confirm is true and confirmToken matches', async () => {
    mockEnvironmentGet.mockResolvedValue(targetEnvironment);
    mockEnvironmentDelete.mockResolvedValue(undefined);

    const tool = deleteEnvironmentTool(mockConfig);
    const args = {
      ...mockArgs,
      environmentId: targetEnv,
      confirm: true,
      confirmToken: validToken,
    };
    const result = await tool(args);

    expect(createToolClient).toHaveBeenCalledWith(mockConfig, args);
    expect(mockEnvironmentDelete).toHaveBeenCalledWith({
      spaceId: args.spaceId,
      environmentId: targetEnv,
    });

    const expected = formatResponse('Environment deleted successfully', {
      environmentId: targetEnv,
    });
    expect(result).toEqual({ content: [{ type: 'text', text: expected }] });
  });

  it('handles errors when environment get fails before confirmation', async () => {
    mockEnvironmentGet.mockRejectedValue(new Error('Environment not found'));

    const tool = deleteEnvironmentTool(mockConfig);
    const result = await tool({ ...mockArgs, environmentId: targetEnv });

    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error deleting environment: Environment not found' },
      ],
    });
  });

  it('handles errors when deletion fails after confirmation', async () => {
    mockEnvironmentGet.mockResolvedValue(targetEnvironment);
    mockEnvironmentDelete.mockRejectedValue(new Error('Deletion failed'));

    const tool = deleteEnvironmentTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      environmentId: targetEnv,
      confirm: true,
      confirmToken: validToken,
    });

    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error deleting environment: Deletion failed' },
      ],
    });
  });
});
