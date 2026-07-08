import {
  getTemplateTool,
  GetTemplateToolParams,
} from './getTemplate.js';
import {
  listTemplatesTool,
  ListTemplatesToolParams,
} from './listTemplates.js';
import {
  createTemplateTool,
  CreateTemplateToolParams,
} from './createTemplate.js';
import {
  upsertTemplateTool,
  UpsertTemplateToolParams,
} from './upsertTemplate.js';
import {
  deleteTemplateTool,
  DeleteTemplateToolParams,
} from './deleteTemplate.js';
import {
  publishTemplateTool,
  PublishTemplateToolParams,
} from './publishTemplate.js';
import {
  unpublishTemplateTool,
  UnpublishTemplateToolParams,
} from './unpublishTemplate.js';
import type { ContentfulConfig } from '../../../config/types.js';

export function createTemplateTools(config: ContentfulConfig) {
  const getTemplate = getTemplateTool(config);
  const listTemplates = listTemplatesTool(config);
  const createTemplate = createTemplateTool(config);
  const upsertTemplate = upsertTemplateTool(config);
  const deleteTemplate = deleteTemplateTool(config);
  const publishTemplate = publishTemplateTool(config);
  const unpublishTemplate = unpublishTemplateTool(config);

  return {
    getTemplate: {
      title: 'get_template',
      description:
        'Get details about a specific ExO template (a layout definition that backs template-based Experiences).',
      inputParams: GetTemplateToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: getTemplate,
    },
    listTemplates: {
      title: 'list_templates',
      description:
        'List ExO templates in a space and environment. Returns a maximum of 10 items per request; use the pageNext cursor (returned in pages.next) to paginate.',
      inputParams: ListTemplatesToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: listTemplates,
    },
    createTemplate: {
      title: 'create_template',
      description: 'Create a new ExO template.',
      inputParams: CreateTemplateToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: createTemplate,
    },
    upsertTemplate: {
      title: 'upsert_template',
      description:
        'Update an existing ExO template. You MUST call get_template first to read the current state, then pass the sys.version you received as the version parameter. The handler merges your updates with the existing template fields, so you only need to provide the fields you want to change. If the version is stale (the template changed since you read it), the update is rejected and you must re-fetch with get_template.',
      inputParams: UpsertTemplateToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: upsertTemplate,
    },
    deleteTemplate: {
      title: 'delete_template',
      description:
        'Delete an ExO template. Two-phase: the first call (without confirm/confirmToken) returns a preview and a confirmToken. To complete the deletion, call again with the same templateId, confirm: true, and the confirmToken from the preview.',
      inputParams: DeleteTemplateToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: deleteTemplate,
    },
    publishTemplate: {
      title: 'publish_template',
      description:
        'Publish an ExO template. You MUST call get_template first and pass the returned sys.version as the version parameter. If the version is stale the operation is rejected and you must re-fetch with get_template.',
      inputParams: PublishTemplateToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: publishTemplate,
    },
    unpublishTemplate: {
      title: 'unpublish_template',
      description:
        'Unpublish an ExO template. You MUST call get_template first and pass the returned sys.version as the version parameter. If the version is stale the operation is rejected and you must re-fetch with get_template.',
      inputParams: UnpublishTemplateToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: unpublishTemplate,
    },
  };
}
