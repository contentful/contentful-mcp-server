import {
  getExperienceFragmentTool,
  GetExperienceFragmentToolParams,
} from './getExperienceFragment.js';
import {
  listExperienceFragmentsTool,
  ListExperienceFragmentsToolParams,
} from './listExperienceFragments.js';
import {
  createExperienceFragmentTool,
  CreateExperienceFragmentToolParams,
} from './createExperienceFragment.js';
import {
  updateExperienceFragmentTool,
  UpdateExperienceFragmentToolParams,
} from './updateExperienceFragment.js';
import {
  deleteExperienceFragmentTool,
  DeleteExperienceFragmentToolParams,
} from './deleteExperienceFragment.js';
import {
  publishExperienceFragmentTool,
  PublishExperienceFragmentToolParams,
} from './publishExperienceFragment.js';
import {
  unpublishExperienceFragmentTool,
  UnpublishExperienceFragmentToolParams,
} from './unpublishExperienceFragment.js';
import type { ContentfulConfig } from '../../../config/types.js';

export function createExperienceFragmentTools(config: ContentfulConfig) {
  const getExperienceFragment = getExperienceFragmentTool(config);
  const listExperienceFragments = listExperienceFragmentsTool(config);
  const createExperienceFragment = createExperienceFragmentTool(config);
  const updateExperienceFragment = updateExperienceFragmentTool(config);
  const deleteExperienceFragment = deleteExperienceFragmentTool(config);
  const publishExperienceFragment = publishExperienceFragmentTool(config);
  const unpublishExperienceFragment = unpublishExperienceFragmentTool(config);

  return {
    getExperienceFragment: {
      title: 'get_experience_fragment',
      description:
        'Get details about a specific ExO experience fragment (a reusable content unit that can be referenced across multiple Experiences and Components).',
      inputParams: GetExperienceFragmentToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: getExperienceFragment,
    },
    listExperienceFragments: {
      title: 'list_experience_fragments',
      description:
        'List ExO experience fragments in a space and environment. Returns a maximum of 10 items per request; use the pageNext cursor (returned in pages.next) to paginate.',
      inputParams: ListExperienceFragmentsToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: listExperienceFragments,
    },
    createExperienceFragment: {
      title: 'create_experience_fragment',
      description: 'Create a new ExO experience fragment.',
      inputParams: CreateExperienceFragmentToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: createExperienceFragment,
    },
    updateExperienceFragment: {
      title: 'update_experience_fragment',
      description:
        'Update an existing ExO experience fragment. You MUST call get_experience_fragment first to read the current state, then pass the sys.version you received as the version parameter. The handler merges your updates with the existing experience fragment fields, so you only need to provide the fields you want to change. If the version is stale (the experience fragment changed since you read it), the update is rejected and you must re-fetch with get_experience_fragment.',
      inputParams: UpdateExperienceFragmentToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: updateExperienceFragment,
    },
    deleteExperienceFragment: {
      title: 'delete_experience_fragment',
      description:
        'Delete an ExO experience fragment. Two-phase: the first call (without confirm/confirmToken) returns a preview and a confirmToken. To complete the deletion, call again with the same experienceFragmentId, confirm: true, and the confirmToken from the preview.',
      inputParams: DeleteExperienceFragmentToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: deleteExperienceFragment,
    },
    publishExperienceFragment: {
      title: 'publish_experience_fragment',
      description:
        'Publish an ExO experience fragment. You MUST call get_experience_fragment first and pass the returned sys.version as the version parameter. If the version is stale the operation is rejected and you must re-fetch with get_experience_fragment.',
      inputParams: PublishExperienceFragmentToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: publishExperienceFragment,
    },
    unpublishExperienceFragment: {
      title: 'unpublish_experience_fragment',
      description:
        'Unpublish an ExO experience fragment. You MUST call get_experience_fragment first and pass the returned sys.version as the version parameter. If the version is stale the operation is rejected and you must re-fetch with get_experience_fragment.',
      inputParams: UnpublishExperienceFragmentToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: unpublishExperienceFragment,
    },
  };
}
