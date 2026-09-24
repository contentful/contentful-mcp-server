import { listReleasesTool, ListReleasesToolParams } from './listReleases.js';
import { getReleaseTool, GetReleaseToolParams } from './getRelease.js';
import { createReleaseTool, CreateReleaseToolParams } from './createRelease.js';
import { updateReleaseTool, UpdateReleaseToolParams } from './updateRelease.js';
import { deleteReleaseTool, DeleteReleaseToolParams } from './deleteRelease.js';
import {
  publishReleaseTool,
  PublishReleaseToolParams,
} from './publishRelease.js';
import {
  unpublishReleaseTool,
  UnpublishReleaseToolParams,
} from './unpublishRelease.js';
import {
  validateReleaseTool,
  ValidateReleaseToolParams,
} from './validateRelease.js';
import {
  getReleaseActionTool,
  GetReleaseActionToolParams,
} from './getReleaseAction.js';
import {
  listReleaseActionsTool,
  ListReleaseActionsToolParams,
} from './listReleaseActions.js';
import {
  schedulePublishReleaseTool,
  SchedulePublishReleaseToolParams,
} from './scheduleReleasePublish.js';
import {
  scheduleUnpublishReleaseTool,
  ScheduleUnpublishReleaseToolParams,
} from './scheduleReleaseUnpublish.js';
import {
  cancelScheduledReleaseTool,
  CancelScheduledReleaseToolParams,
} from './cancelScheduledRelease.js';
import {
  listScheduledActionsTool,
  ListScheduledActionsToolParams,
} from './listScheduledActions.js';
import type { ContentfulConfig } from '../../config/types.js';

export function createReleaseTools(config: ContentfulConfig) {
  const listReleases = listReleasesTool(config);
  const getRelease = getReleaseTool(config);
  const createRelease = createReleaseTool(config);
  const updateRelease = updateReleaseTool(config);
  const deleteRelease = deleteReleaseTool(config);
  const publishRelease = publishReleaseTool(config);
  const unpublishRelease = unpublishReleaseTool(config);
  const validateRelease = validateReleaseTool(config);
  const getReleaseAction = getReleaseActionTool(config);
  const listReleaseActions = listReleaseActionsTool(config);
  const schedulePublishRelease = schedulePublishReleaseTool(config);
  const scheduleUnpublishRelease = scheduleUnpublishReleaseTool(config);
  const cancelScheduledRelease = cancelScheduledReleaseTool(config);
  const listScheduledActions = listScheduledActionsTool(config);

  return {
    listReleases: {
      title: 'list_releases',
      description:
        'List releases in a space/environment. Returns a maximum of 10 items per request. Use pageNext/pagePrev cursors to paginate through results.',
      inputParams: ListReleasesToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: listReleases,
    },
    getRelease: {
      title: 'get_release',
      description: 'Retrieve a release',
      inputParams: GetReleaseToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: getRelease,
    },
    createRelease: {
      title: 'create_release',
      description:
        'Create a release with a title and a set of Entries/Assets to include in it.',
      inputParams: CreateReleaseToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: createRelease,
    },
    updateRelease: {
      title: 'update_release',
      description:
        "Update a release's title and/or the Entries/Assets it contains. Omitted fields keep their current value.",
      inputParams: UpdateReleaseToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: updateRelease,
    },
    deleteRelease: {
      title: 'delete_release',
      description:
        'Delete a release. This is a two-phase operation: the first call (without confirm/confirmToken) returns a preview of the release and a confirmToken. To complete the deletion, call this tool again with the same releaseId, confirm: true, and the confirmToken from the preview response. Deleting a release also permanently deletes all ReleaseActions linked to it.',
      inputParams: DeleteReleaseToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: deleteRelease,
    },
    publishRelease: {
      title: 'publish_release',
      description:
        'Publish a release. Publishing is asynchronous: this tool returns as soon as the publish is queued (status created/inProgress), not once it completes. Use get_release_action with the returned actionId to check the outcome.',
      inputParams: PublishReleaseToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: publishRelease,
    },
    unpublishRelease: {
      title: 'unpublish_release',
      description:
        'Unpublish a release. Unpublishing is asynchronous: this tool returns as soon as the unpublish is queued (status created/inProgress), not once it completes. Use get_release_action with the returned actionId to check the outcome.',
      inputParams: UnpublishReleaseToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: unpublishRelease,
    },
    validateRelease: {
      title: 'validate_release',
      description:
        'Validate a release, optionally against a specific downstream action (publish or unpublish). Validation is asynchronous: this tool returns as soon as validation is queued (status created/inProgress), not once it completes. Use get_release_action with the returned actionId to check the outcome.',
      inputParams: ValidateReleaseToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: validateRelease,
    },
    getReleaseAction: {
      title: 'get_release_action',
      description:
        'Retrieve a release action by ID to check the status (created, inProgress, succeeded, failed) of a previously queued publish, unpublish, or validate operation.',
      inputParams: GetReleaseActionToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: getReleaseAction,
    },
    listReleaseActions: {
      title: 'list_release_actions',
      description:
        'List release actions in a space/environment. Returns a maximum of 10 items per request. Optionally filter by release ID, action type (publish/unpublish/validate), or status.',
      inputParams: ListReleaseActionsToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: listReleaseActions,
    },
    schedulePublishRelease: {
      title: 'schedule_publish_release',
      description:
        'Schedule a release to publish at a future datetime, or reschedule an existing scheduled publish action by providing scheduledActionId.',
      inputParams: SchedulePublishReleaseToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: schedulePublishRelease,
    },
    scheduleUnpublishRelease: {
      title: 'schedule_unpublish_release',
      description:
        'Schedule a release to unpublish at a future datetime, or reschedule an existing scheduled unpublish action by providing scheduledActionId.',
      inputParams: ScheduleUnpublishReleaseToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: scheduleUnpublishRelease,
    },
    cancelScheduledRelease: {
      title: 'cancel_scheduled_release',
      description:
        'Cancel a scheduled release action. This is a two-phase operation: the first call (without confirm/confirmToken) returns a preview of the scheduled action and a confirmToken. To complete the cancellation, call this tool again with the same scheduledActionId, confirm: true, and the confirmToken from the preview response.',
      inputParams: CancelScheduledReleaseToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: cancelScheduledRelease,
    },
    listScheduledActions: {
      title: 'list_scheduled_actions',
      description:
        'List scheduled actions in a space/environment. Returns a maximum of 10 items per request. Optionally filter by release ID or status.',
      inputParams: ListScheduledActionsToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: listScheduledActions,
    },
  };
}
