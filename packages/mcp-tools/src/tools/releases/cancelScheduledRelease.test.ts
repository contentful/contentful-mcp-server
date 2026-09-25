import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cancelScheduledReleaseTool } from './cancelScheduledRelease.js';
import { formatResponse } from '../../utils/formatters.js';
import { buildConfirmToken } from '../../utils/confirmation.js';
import {
  setupMockClient,
  mockScheduledActionGet,
  mockScheduledActionDelete,
  mockArgs,
  mockScheduledAction,
} from './mockClient.js';

vi.mock('../../utils/tools.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../utils/tools.js')>();
  return {
    ...orig,
    createToolClient: vi.fn(),
  };
});
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('cancelScheduledRelease', () => {
  const mockConfig = createMockConfig();
  const validToken = buildConfirmToken(
    'scheduledAction',
    'test-scheduled-action-id',
    mockScheduledAction.sys.version,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    setupMockClient();
  });

  it('returns a confirmation preview when confirm is missing', async () => {
    mockScheduledActionGet.mockResolvedValue(mockScheduledAction);

    const tool = cancelScheduledReleaseTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      scheduledActionId: 'test-scheduled-action-id',
    });

    expect(mockScheduledActionDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
    expect(result.content[0].text).toContain(validToken);
  });

  it('returns a confirmation preview when confirmToken is wrong', async () => {
    mockScheduledActionGet.mockResolvedValue(mockScheduledAction);

    const tool = cancelScheduledReleaseTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      scheduledActionId: 'test-scheduled-action-id',
      confirm: true,
      confirmToken: 'wrong',
    });

    expect(mockScheduledActionDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('cancels when confirm is true and confirmToken matches', async () => {
    mockScheduledActionGet.mockResolvedValue(mockScheduledAction);
    mockScheduledActionDelete.mockResolvedValue(undefined);

    const tool = cancelScheduledReleaseTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      scheduledActionId: 'test-scheduled-action-id',
      confirm: true,
      confirmToken: validToken,
    });

    expect(mockScheduledActionDelete).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      scheduledActionId: 'test-scheduled-action-id',
    });

    const expected = formatResponse(
      'Scheduled release action canceled successfully',
      { scheduledAction: mockScheduledAction },
    );
    expect(result).toEqual({ content: [{ type: 'text', text: expected }] });
  });

  it('handles errors when scheduled action get fails before confirmation', async () => {
    mockScheduledActionGet.mockRejectedValue(
      new Error('Scheduled action not found'),
    );

    const tool = cancelScheduledReleaseTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      scheduledActionId: 'test-scheduled-action-id',
    });

    expect(mockScheduledActionDelete).not.toHaveBeenCalled();
    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error canceling scheduled release action: Scheduled action not found',
        },
      ],
    });
  });

  it('handles errors when cancellation fails after confirmation', async () => {
    mockScheduledActionGet.mockResolvedValue(mockScheduledAction);
    mockScheduledActionDelete.mockRejectedValue(
      new Error('Scheduled action cancellation failed'),
    );

    const tool = cancelScheduledReleaseTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      scheduledActionId: 'test-scheduled-action-id',
      confirm: true,
      confirmToken: validToken,
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error canceling scheduled release action: Scheduled action cancellation failed',
        },
      ],
    });
  });

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = cancelScheduledReleaseTool(protectedConfig);
    const result = await tool({
      ...mockArgs,
      environmentId: 'master',
      scheduledActionId: 'test-scheduled-action-id',
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error canceling scheduled release action: Environment 'master' is protected. Write and delete operations are not allowed.",
        },
      ],
    });
    expect(mockScheduledActionDelete).not.toHaveBeenCalled();
  });
});
