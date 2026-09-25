import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import {
  BaseToolSchema,
  createToolClient,
  assertEnvironmentNotProtected,
} from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

export const SchedulePublishReleaseToolParams = BaseToolSchema.extend({
  releaseId: z
    .string()
    .describe('The ID of the release to schedule for publish'),
  datetime: z
    .string()
    .datetime({ offset: true, local: true })
    .describe('The ISO 8601 datetime at which the release should publish'),
  timezone: z
    .string()
    .refine((timezone) => {
      try {
        Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(0);
        return true;
      } catch {
        return false;
      }
    }, 'Must be a valid IANA timezone identifier')
    .optional()
    .describe('A valid IANA timezone identifier (e.g. Asia/Kolkata)'),
  scheduledActionId: z
    .string()
    .optional()
    .describe(
      'Provide to reschedule an existing scheduled action instead of creating a new one',
    ),
});

type Params = z.infer<typeof SchedulePublishReleaseToolParams>;

export function schedulePublishReleaseTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const contentfulClient = createToolClient(config, args);

    if (args.scheduledActionId) {
      const existing = await contentfulClient.scheduledActions.get({
        spaceId: args.spaceId,
        environmentId: args.environmentId,
        scheduledActionId: args.scheduledActionId,
      });

      if (existing.action !== 'publish') {
        throw new Error(
          `Scheduled action '${args.scheduledActionId}' is a '${existing.action}' action, not 'publish'.`,
        );
      }
      if (existing.entity.sys.id !== args.releaseId) {
        throw new Error(
          `Scheduled action '${args.scheduledActionId}' targets release '${existing.entity.sys.id}', not '${args.releaseId}'.`,
        );
      }

      const scheduledAction = await contentfulClient.scheduledActions.update(
        {
          spaceId: args.spaceId,
          scheduledActionId: args.scheduledActionId,
          version: existing.sys.version,
        },
        {
          action: 'publish',
          entity: existing.entity,
          environment: existing.environment,
          scheduledFor: {
            datetime: args.datetime,
            timezone: args.timezone,
          },
        },
      );

      return createSuccessResponse(
        'Scheduled release publish rescheduled successfully',
        { scheduledAction },
      );
    }

    const scheduledAction = await contentfulClient.scheduledActions.create(
      { spaceId: args.spaceId },
      {
        entity: {
          sys: { type: 'Link', linkType: 'Release', id: args.releaseId },
        },
        environment: {
          sys: {
            type: 'Link',
            linkType: 'Environment',
            id: args.environmentId,
          },
        },
        action: 'publish',
        scheduledFor: {
          datetime: args.datetime,
          timezone: args.timezone,
        },
      },
    );

    return createSuccessResponse('Release publish scheduled successfully', {
      scheduledAction,
    });
  }

  return withErrorHandling(tool, 'Error scheduling release publish');
}
