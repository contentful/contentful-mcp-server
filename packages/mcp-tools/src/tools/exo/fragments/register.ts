import {
  getFragmentTool,
  GetFragmentToolParams,
} from './getFragment.js';
import {
  listFragmentsTool,
  ListFragmentsToolParams,
} from './listFragments.js';
import {
  createFragmentTool,
  CreateFragmentToolParams,
} from './createFragment.js';
import {
  updateFragmentTool,
  UpdateFragmentToolParams,
} from './updateFragment.js';
import {
  deleteFragmentTool,
  DeleteFragmentToolParams,
} from './deleteFragment.js';
import {
  publishFragmentTool,
  PublishFragmentToolParams,
} from './publishFragment.js';
import {
  unpublishFragmentTool,
  UnpublishFragmentToolParams,
} from './unpublishFragment.js';
import type { ContentfulConfig } from '../../../config/types.js';

export function createFragmentTools(config: ContentfulConfig) {
  const getFragment = getFragmentTool(config);
  const listFragments = listFragmentsTool(config);
  const createFragment = createFragmentTool(config);
  const updateFragment = updateFragmentTool(config);
  const deleteFragment = deleteFragmentTool(config);
  const publishFragment = publishFragmentTool(config);
  const unpublishFragment = unpublishFragmentTool(config);

  return {
    getFragment: {
      title: 'get_fragment',
      description:
        'Get details about a specific ExO fragment (a reusable content unit that can be referenced across multiple Experiences and ComponentTypes).',
      inputParams: GetFragmentToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: getFragment,
    },
    listFragments: {
      title: 'list_fragments',
      description:
        'List ExO fragments in a space and environment. Returns a maximum of 10 items per request; use the pageNext cursor (returned in pages.next) to paginate.',
      inputParams: ListFragmentsToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: listFragments,
    },
    createFragment: {
      title: 'create_fragment',
      description: 'Create a new ExO fragment.',
      inputParams: CreateFragmentToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: createFragment,
    },
    updateFragment: {
      title: 'update_fragment',
      description:
        'Update an existing ExO fragment. You MUST call get_fragment first to read the current state, then pass the sys.version you received as the version parameter. The handler merges your updates with the existing fragment fields, so you only need to provide the fields you want to change. If the version is stale (the fragment changed since you read it), the update is rejected and you must re-fetch with get_fragment.',
      inputParams: UpdateFragmentToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: updateFragment,
    },
    deleteFragment: {
      title: 'delete_fragment',
      description:
        'Delete an ExO fragment. Two-phase: the first call (without confirm/confirmToken) returns a preview and a confirmToken. To complete the deletion, call again with the same fragmentId, confirm: true, and the confirmToken from the preview.',
      inputParams: DeleteFragmentToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: deleteFragment,
    },
    publishFragment: {
      title: 'publish_fragment',
      description:
        'Publish an ExO fragment. You MUST call get_fragment first and pass the returned sys.version as the version parameter. If the version is stale the operation is rejected and you must re-fetch with get_fragment.',
      inputParams: PublishFragmentToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: publishFragment,
    },
    unpublishFragment: {
      title: 'unpublish_fragment',
      description:
        'Unpublish an ExO fragment. You MUST call get_fragment first and pass the returned sys.version as the version parameter. If the version is stale the operation is rejected and you must re-fetch with get_fragment.',
      inputParams: UnpublishFragmentToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: unpublishFragment,
    },
  };
}
