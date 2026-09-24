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

export const ScheduleUnpublishReleaseToolParams = BaseToolSchema.extend({
  releaseId: z
    .string()
    .describe('The ID of the release to schedule for unpublish'),
  datetime: z
    .string()
    .describe('The ISO 8601 datetime at which the release should unpublish'),
  timezone: z
    .string()
    .optional()
    .describe('A valid IANA timezone identifier (e.g. Asia/Kolkata)'),
  scheduledActionId: z
    .string()
    .optional()
    .describe(
      'Provide to reschedule an existing scheduled action instead of creating a new one',
    ),
});

type Params = z.infer<typeof ScheduleUnpublishReleaseToolParams>;

export function scheduleUnpublishReleaseTool(config: ContentfulConfig) {
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

      if (existing.action !== 'unpublish') {
        throw new Error(
          `Scheduled action '${args.scheduledActionId}' is a '${existing.action}' action, not 'unpublish'.`,
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
          action: 'unpublish',
          entity: existing.entity,
          environment: existing.environment,
          scheduledFor: {
            datetime: args.datetime,
            timezone: args.timezone,
          },
        },
      );

      return createSuccessResponse(
        'Scheduled release unpublish rescheduled successfully',
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
        action: 'unpublish',
        scheduledFor: {
          datetime: args.datetime,
          timezone: args.timezone,
        },
      },
    );

    return createSuccessResponse('Release unpublish scheduled successfully', {
      scheduledAction,
    });
  }

  return withErrorHandling(tool, 'Error scheduling release unpublish');
}
