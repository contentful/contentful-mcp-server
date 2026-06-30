import {
  getExperienceTool,
  GetExperienceToolParams,
} from './getExperience.js';
import {
  listExperiencesTool,
  ListExperiencesToolParams,
} from './listExperiences.js';
import {
  createExperienceTool,
  CreateExperienceToolParams,
} from './createExperience.js';
import {
  upsertExperienceTool,
  UpsertExperienceToolParams,
} from './upsertExperience.js';
import {
  deleteExperienceTool,
  DeleteExperienceToolParams,
} from './deleteExperience.js';
import {
  publishExperienceTool,
  PublishExperienceToolParams,
} from './publishExperience.js';
import {
  unpublishExperienceTool,
  UnpublishExperienceToolParams,
} from './unpublishExperience.js';
import type { ContentfulConfig } from '../../../config/types.js';

export function createExperienceTools(config: ContentfulConfig) {
  const getExperience = getExperienceTool(config);
  const listExperiences = listExperiencesTool(config);
  const createExperience = createExperienceTool(config);
  const upsertExperience = upsertExperienceTool(config);
  const deleteExperience = deleteExperienceTool(config);
  const publishExperience = publishExperienceTool(config);
  const unpublishExperience = unpublishExperienceTool(config);

  return {
    getExperience: {
      title: 'get_experience',
      description:
        'Get details about a specific ExO experience (a concrete page or screen that composes a root ComponentType with content and design settings, backed by a Template).',
      inputParams: GetExperienceToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: getExperience,
    },
    listExperiences: {
      title: 'list_experiences',
      description:
        'List ExO experiences in a space and environment. Returns a maximum of 10 items per request; use the pageNext cursor (returned in pages.next) to paginate.',
      inputParams: ListExperiencesToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: listExperiences,
    },
    createExperience: {
      title: 'create_experience',
      description: 'Create a new ExO experience backed by a Template.',
      inputParams: CreateExperienceToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: createExperience,
    },
    upsertExperience: {
      title: 'upsert_experience',
      description:
        'Update an existing ExO experience. You MUST call get_experience first to read the current state, then pass the sys.version you received as the version parameter. The handler merges your updates with the existing experience fields, so you only need to provide the fields you want to change. If the version is stale (the experience changed since you read it), the update is rejected and you must re-fetch with get_experience.',
      inputParams: UpsertExperienceToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: upsertExperience,
    },
    deleteExperience: {
      title: 'delete_experience',
      description:
        'Delete an ExO experience. Two-phase: the first call (without confirm/confirmToken) returns a preview and a confirmToken. To complete the deletion, call again with the same experienceId, confirm: true, and the confirmToken from the preview.',
      inputParams: DeleteExperienceToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: deleteExperience,
    },
    publishExperience: {
      title: 'publish_experience',
      description:
        'Publish an ExO experience. You MUST call get_experience first and pass the returned sys.version as the version parameter. If the version is stale the operation is rejected and you must re-fetch with get_experience.',
      inputParams: PublishExperienceToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: publishExperience,
    },
    unpublishExperience: {
      title: 'unpublish_experience',
      description:
        'Unpublish an ExO experience. You MUST call get_experience first and pass the returned sys.version as the version parameter. If the version is stale the operation is rejected and you must re-fetch with get_experience.',
      inputParams: UnpublishExperienceToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: unpublishExperience,
    },
  };
}
