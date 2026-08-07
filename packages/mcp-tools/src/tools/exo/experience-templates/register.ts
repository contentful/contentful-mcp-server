import {
  getExperienceTemplateTool,
  GetExperienceTemplateToolParams,
} from './getExperienceTemplate.js';
import {
  listExperienceTemplatesTool,
  ListExperienceTemplatesToolParams,
} from './listExperienceTemplates.js';
import {
  createExperienceTemplateTool,
  CreateExperienceTemplateToolParams,
} from './createExperienceTemplate.js';
import {
  upsertExperienceTemplateTool,
  UpsertExperienceTemplateToolParams,
} from './upsertExperienceTemplate.js';
import {
  deleteExperienceTemplateTool,
  DeleteExperienceTemplateToolParams,
} from './deleteExperienceTemplate.js';
import {
  publishExperienceTemplateTool,
  PublishExperienceTemplateToolParams,
} from './publishExperienceTemplate.js';
import {
  unpublishExperienceTemplateTool,
  UnpublishExperienceTemplateToolParams,
} from './unpublishExperienceTemplate.js';
import type { ContentfulConfig } from '../../../config/types.js';

export function createExperienceTemplateTools(config: ContentfulConfig) {
  const getExperienceTemplate = getExperienceTemplateTool(config);
  const listExperienceTemplates = listExperienceTemplatesTool(config);
  const createExperienceTemplate = createExperienceTemplateTool(config);
  const upsertExperienceTemplate = upsertExperienceTemplateTool(config);
  const deleteExperienceTemplate = deleteExperienceTemplateTool(config);
  const publishExperienceTemplate = publishExperienceTemplateTool(config);
  const unpublishExperienceTemplate = unpublishExperienceTemplateTool(config);

  return {
    getExperienceTemplate: {
      title: 'get_experience_template',
      description:
        'Get details about a specific ExO experience template (a layout definition that backs experience-template-based Experiences).',
      inputParams: GetExperienceTemplateToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: getExperienceTemplate,
    },
    listExperienceTemplates: {
      title: 'list_experience_templates',
      description:
        'List ExO experience templates in a space and environment. Returns a maximum of 10 items per request; use the pageNext cursor (returned in pages.next) to paginate.',
      inputParams: ListExperienceTemplatesToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: listExperienceTemplates,
    },
    createExperienceTemplate: {
      title: 'create_experience_template',
      description: 'Create a new ExO experience template.',
      inputParams: CreateExperienceTemplateToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: createExperienceTemplate,
    },
    upsertExperienceTemplate: {
      title: 'upsert_experience_template',
      description:
        'Update an existing ExO experience template. You MUST call get_experience_template first to read the current state, then pass the sys.version you received as the version parameter. The handler merges your updates with the existing experience template fields, so you only need to provide the fields you want to change. If the version is stale (the experience template changed since you read it), the update is rejected and you must re-fetch with get_experience_template.',
      inputParams: UpsertExperienceTemplateToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: upsertExperienceTemplate,
    },
    deleteExperienceTemplate: {
      title: 'delete_experience_template',
      description:
        'Delete an ExO experience template. Two-phase: the first call (without confirm/confirmToken) returns a preview and a confirmToken. To complete the deletion, call again with the same experienceTemplateId, confirm: true, and the confirmToken from the preview.',
      inputParams: DeleteExperienceTemplateToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: deleteExperienceTemplate,
    },
    publishExperienceTemplate: {
      title: 'publish_experience_template',
      description:
        'Publish an ExO experience template. You MUST call get_experience_template first and pass the returned sys.version as the version parameter. If the version is stale the operation is rejected and you must re-fetch with get_experience_template.',
      inputParams: PublishExperienceTemplateToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: publishExperienceTemplate,
    },
    unpublishExperienceTemplate: {
      title: 'unpublish_experience_template',
      description:
        'Unpublish an ExO experience template. You MUST call get_experience_template first and pass the returned sys.version as the version parameter. If the version is stale the operation is rejected and you must re-fetch with get_experience_template.',
      inputParams: UnpublishExperienceTemplateToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: unpublishExperienceTemplate,
    },
  };
}
