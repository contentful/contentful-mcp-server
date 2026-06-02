import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deleteAiActionTool } from './deleteAiAction.js';
import { formatResponse } from '../../utils/formatters.js';
import { buildConfirmToken } from '../../utils/confirmation.js';
import {
  setupMockClient,
  mockAiActionDelete,
  mockArgs,
  mockAiAction,
  mockAiActionGet,
} from './mockClient.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

vi.mock('../../utils/tools.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../utils/tools.js')>();
  return { ...orig, createToolClient: vi.fn() };
});

describe('deleteAiAction', () => {
  const mockConfig = createMockConfig();
  const validToken = buildConfirmToken(
    'aiAction',
    mockArgs.aiActionId,
    mockAiAction.sys.version,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    setupMockClient();
  });

  it('returns a confirmation preview when confirm is missing', async () => {
    mockAiActionGet.mockResolvedValue(mockAiAction);

    const tool = deleteAiActionTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockAiActionDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
    expect(result.content[0].text).toContain(validToken);
  });

  it('returns a confirmation preview when confirmToken is wrong', async () => {
    mockAiActionGet.mockResolvedValue(mockAiAction);

    const tool = deleteAiActionTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: 'wrong',
    });

    expect(mockAiActionDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('returns a confirmation preview when confirm is true but confirmToken is missing', async () => {
    mockAiActionGet.mockResolvedValue(mockAiAction);

    const tool = deleteAiActionTool(mockConfig);
    const result = await tool({ ...mockArgs, confirm: true });

    expect(mockAiActionDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('returns a confirmation preview when confirm is false even with correct token', async () => {
    mockAiActionGet.mockResolvedValue(mockAiAction);

    const tool = deleteAiActionTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: false,
      confirmToken: validToken,
    });

    expect(mockAiActionDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('deletes when confirm is true and confirmToken matches', async () => {
    mockAiActionGet.mockResolvedValue(mockAiAction);
    mockAiActionDelete.mockResolvedValue(undefined);

    const tool = deleteAiActionTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: validToken,
    });

    expect(mockAiActionDelete).toHaveBeenCalledOnce();
    const expected = formatResponse('AI action deleted successfully', {
      aiAction: mockAiAction,
    });
    expect(result).toEqual({ content: [{ type: 'text', text: expected }] });
  });

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = deleteAiActionTool(protectedConfig);
    const result = await tool({ ...mockArgs, environmentId: 'master' });
    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error deleting AI action: Environment 'master' is protected. Write and delete operations are not allowed.",
        },
      ],
    });
  });

  it('handles errors when AI action get fails before confirmation', async () => {
    mockAiActionGet.mockRejectedValue(new Error('AI action not found'));

    const tool = deleteAiActionTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error deleting AI action: AI action not found' },
      ],
    });
  });

  it('handles errors when deletion fails after confirmation', async () => {
    mockAiActionGet.mockResolvedValue(mockAiAction);
    mockAiActionDelete.mockRejectedValue(new Error('Deletion failed'));

    const tool = deleteAiActionTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: validToken,
    });

    expect(result).toEqual({
      isError: true,
      content: [
        { type: 'text', text: 'Error deleting AI action: Deletion failed' },
      ],
    });
  });
});
