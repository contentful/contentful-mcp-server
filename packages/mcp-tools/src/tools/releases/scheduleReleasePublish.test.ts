import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SchedulePublishReleaseToolParams,
  schedulePublishReleaseTool,
} from './scheduleReleasePublish.js';
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

describe('schedulePublishRelease', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    setupMockClient();
    vi.clearAllMocks();
  });

  it('rejects a datetime without a UTC offset', () => {
    expect(
      SchedulePublishReleaseToolParams.safeParse({
        ...mockArgs,
        datetime: '2026-01-01T00:00:00',
      }).success,
    ).toBe(false);
    expect(
      SchedulePublishReleaseToolParams.safeParse({
        ...mockArgs,
        datetime: '2026-01-01T00:00:00+02:00',
      }).success,
    ).toBe(true);
  });

  it('rejects a datetime whose UTC offset conflicts with timezone', async () => {
    const tool = schedulePublishReleaseTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      datetime: '2027-01-15T10:00:00Z',
      timezone: 'America/New_York',
    });

    expect(mockScheduledActionCreate).not.toHaveBeenCalled();
    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: "Error scheduling release publish: datetime '2027-01-15T10:00:00Z' has a UTC offset that does not match timezone 'America/New_York' at that instant. Either omit timezone, or provide a datetime whose offset agrees with it.",
        },
      ],
    });
  });

  it('accepts a datetime whose UTC offset agrees with timezone', async () => {
    mockScheduledActionCreate.mockResolvedValue(mockScheduledAction);

    const tool = schedulePublishReleaseTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      datetime: '2027-03-01T10:00:00-07:00',
      timezone: 'America/Denver',
    });

    expect(mockScheduledActionCreate).toHaveBeenCalled();
    expect(result).not.toHaveProperty('isError');
  });

  it('creates a new scheduled publish action', async () => {
    mockScheduledActionCreate.mockResolvedValue(mockScheduledAction);

    const tool = schedulePublishReleaseTool(mockConfig);
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
        action: 'publish',
        scheduledFor: { datetime: '2026-01-01T00:00:00Z', timezone: 'UTC' },
      },
    );

    const expected = formatResponse('Release publish scheduled successfully', {
      scheduledAction: mockScheduledAction,
    });
    expect(result).toEqual({ content: [{ type: 'text', text: expected }] });
  });

  it('reschedules an existing scheduled publish action', async () => {
    mockScheduledActionGet.mockResolvedValue(mockScheduledAction);
    mockScheduledActionUpdate.mockResolvedValue(mockScheduledAction);

    const tool = schedulePublishReleaseTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      datetime: '2026-02-01T00:00:00Z',
      scheduledActionId: 'test-scheduled-action-id',
    });

    expect(mockScheduledActionGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      scheduledActionId: 'test-scheduled-action-id',
    });

    expect(mockScheduledActionUpdate).toHaveBeenCalledWith(
      {
        spaceId: mockArgs.spaceId,
        scheduledActionId: 'test-scheduled-action-id',
        version: mockScheduledAction.sys.version,
      },
      {
        action: 'publish',
        entity: mockScheduledAction.entity,
        environment: mockScheduledAction.environment,
        scheduledFor: { datetime: '2026-02-01T00:00:00Z', timezone: undefined },
      },
    );

    const expected = formatResponse(
      'Scheduled release publish rescheduled successfully',
      { scheduledAction: mockScheduledAction },
    );
    expect(result).toEqual({ content: [{ type: 'text', text: expected }] });
  });

  it('rejects rescheduling a scheduled action of the wrong action type', async () => {
    mockScheduledActionGet.mockResolvedValue({
      ...mockScheduledAction,
      action: 'unpublish' as const,
    });

    const tool = schedulePublishReleaseTool(mockConfig);
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
          text: "Error scheduling release publish: Scheduled action 'test-scheduled-action-id' is a 'unpublish' action, not 'publish'.",
        },
      ],
    });
  });

  it('rejects rescheduling a scheduled action for a different release', async () => {
    mockScheduledActionGet.mockResolvedValue({
      ...mockScheduledAction,
      entity: {
        sys: { type: 'Link', linkType: 'Release', id: 'other-release-id' },
      },
    });

    const tool = schedulePublishReleaseTool(mockConfig);
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
          text: "Error scheduling release publish: Scheduled action 'test-scheduled-action-id' targets release 'other-release-id', not 'test-release-id'.",
        },
      ],
    });
  });

  it('should return error when environment is protected', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['master'],
    });
    const tool = schedulePublishReleaseTool(protectedConfig);
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
          text: "Error scheduling release publish: Environment 'master' is protected. Write and delete operations are not allowed.",
        },
      ],
    });
    expect(mockScheduledActionCreate).not.toHaveBeenCalled();
  });

  it('handles errors from the create call', async () => {
    mockScheduledActionCreate.mockRejectedValue(new Error('Invalid entity'));

    const tool = schedulePublishReleaseTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      datetime: '2026-01-01T00:00:00Z',
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error scheduling release publish: Invalid entity',
        },
      ],
    });
  });
});
