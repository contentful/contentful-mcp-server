import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ScheduleUnpublishReleaseToolParams,
  scheduleUnpublishReleaseTool,
} from './scheduleReleaseUnpublish.js';
import { formatResponse } from '../../utils/formatters.js';
import {
  setupMockClient,
  mockScheduledActionGet,
  mockScheduledActionCreate,
  mockScheduledActionUpdate,
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

const mockUnpublishAction = {
  ...mockScheduledAction,
  action: 'unpublish' as const,
};

describe('scheduleUnpublishRelease', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  it('rejects a datetime without a UTC offset', () => {
    expect(
      ScheduleUnpublishReleaseToolParams.safeParse({
        ...mockArgs,
        datetime: '2026-01-01T00:00:00',
      }).success,
    ).toBe(false);
    expect(
      ScheduleUnpublishReleaseToolParams.safeParse({
        ...mockArgs,
        datetime: '2026-01-01T00:00:00+02:00',
      }).success,
    ).toBe(true);
  });

  it('creates a new scheduled unpublish action', async () => {
    mockScheduledActionCreate.mockResolvedValue(mockUnpublishAction);

    const tool = scheduleUnpublishReleaseTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      datetime: '2026-01-01T00:00:00Z',
      timezone: 'UTC',
    });

    expect(mockScheduledActionCreate).toHaveBeenCalledWith(
      { spaceId: mockArgs.spaceId },
      {
        entity: {
          sys: { type: 'Link', linkType: 'Release', id: mockArgs.releaseId },
        },
        environment: {
          sys: {
            type: 'Link',
            linkType: 'Environment',
            id: mockArgs.environmentId,
          },
        },
        action: 'unpublish',
        scheduledFor: { datetime: '2026-01-01T00:00:00Z', timezone: 'UTC' },
      },
    );

    const expected = formatResponse(
      'Release unpublish scheduled successfully',
      { scheduledAction: mockUnpublishAction },
    );
    expect(result).toEqual({ content: [{ type: 'text', text: expected }] });
  });

  it('reschedules an existing scheduled unpublish action', async () => {
    mockScheduledActionGet.mockResolvedValue(mockUnpublishAction);
    mockScheduledActionUpdate.mockResolvedValue(mockUnpublishAction);

    const tool = scheduleUnpublishReleaseTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      datetime: '2026-02-01T00:00:00Z',
      scheduledActionId: 'test-scheduled-action-id',
    });

    expect(mockScheduledActionUpdate).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        scheduledActionId: 'test-scheduled-action-id',
        version: mockUnpublishAction.sys.version,
      },
      {
        action: 'unpublish',
        entity: mockUnpublishAction.entity,
        environment: mockUnpublishAction.environment,
        scheduledFor: { datetime: '2026-02-01T00:00:00Z', timezone: undefined },
      },
    );

    const expected = formatResponse(
      'Scheduled release unpublish rescheduled successfully',
      { scheduledAction: mockUnpublishAction },
    );
    expect(result).toEqual({ content: [{ type: 'text', text: expected }] });
  });

  it('rejects rescheduling a scheduled action of the wrong action type', async () => {
    mockScheduledActionGet.mockResolvedValue({
      ...mockScheduledAction,
      action: 'publish' as const,
    });

    const tool = scheduleUnpublishReleaseTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      datetime: '2026-02-01T00:00:00Z',
      scheduledActionId: 'test-scheduled-action-id',
    });

    expect(mockScheduledActionUpdate).not.toHaveBeenCalled();
    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error scheduling release unpublish: Scheduled action 'test-scheduled-action-id' is a 'publish' action, not 'unpublish'.",
        },
      ],
    });
  });

  it('rejects rescheduling a scheduled action for a different release', async () => {
    mockScheduledActionGet.mockResolvedValue({
      ...mockUnpublishAction,
      entity: {
        sys: { type: 'Link', linkType: 'Release', id: 'other-release-id' },
      },
    });

    const tool = scheduleUnpublishReleaseTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      datetime: '2026-02-01T00:00:00Z',
      scheduledActionId: 'test-scheduled-action-id',
    });

    expect(mockScheduledActionUpdate).not.toHaveBeenCalled();
    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error scheduling release unpublish: Scheduled action 'test-scheduled-action-id' targets release 'other-release-id', not 'test-release-id'.",
        },
      ],
    });
  });

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = scheduleUnpublishReleaseTool(protectedConfig);
    const result = await tool({
      ...mockArgs,
      environmentId: 'master',
      datetime: '2026-01-01T00:00:00Z',
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error scheduling release unpublish: Environment 'master' is protected. Write and delete operations are not allowed.",
        },
      ],
    });
    expect(mockScheduledActionCreate).not.toHaveBeenCalled();
  });

  it('handles errors from the create call', async () => {
    mockScheduledActionCreate.mockRejectedValue(new Error('Invalid entity'));

    const tool = scheduleUnpublishReleaseTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      datetime: '2026-01-01T00:00:00Z',
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error scheduling release unpublish: Invalid entity',
        },
      ],
    });
  });
});
