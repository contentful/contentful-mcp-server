import {
  getContentTypeTool,
  GetContentTypeToolParams,
} from './getContentType.js';
import {
  listContentTypesTool,
  ListContentTypesToolParams,
} from './listContentTypes.js';
import {
  createContentTypeTool,
  CreateContentTypeToolParams,
} from './createContentType.js';
import {
  updateContentTypeTool,
  UpdateContentTypeToolParams,
} from './updateContentType.js';
import {
  deleteContentTypeTool,
  DeleteContentTypeToolParams,
} from './deleteContentType.js';
import {
  publishContentTypeTool,
  PublishContentTypeToolParams,
} from './publishContentType.js';
import {
  unpublishContentTypeTool,
  UnpublishContentTypeToolParams,
} from './unpublishContentType.js';
import {
  omitContentTypeFieldTool,
  OmitContentTypeFieldToolParams,
} from './omitContentTypeField.js';
import {
  deleteContentTypeFieldTool,
  DeleteContentTypeFieldToolParams,
} from './deleteContentTypeField.js';
import {
  disableContentTypeFieldTool,
  DisableContentTypeFieldToolParams,
} from './disableContentTypeField.js';
import type { ContentfulConfig } from '../../config/types.js';

export function createContentTypeTools(config: ContentfulConfig) {
  const getContentType = getContentTypeTool(config);
  const listContentTypes = listContentTypesTool(config);
  const createContentType = createContentTypeTool(config);
  const updateContentType = updateContentTypeTool(config);
  const deleteContentType = deleteContentTypeTool(config);
  const publishContentType = publishContentTypeTool(config);
  const unpublishContentType = unpublishContentTypeTool(config);
  const omitContentTypeField = omitContentTypeFieldTool(config);
  const deleteContentTypeField = deleteContentTypeFieldTool(config);
  const disableContentTypeField = disableContentTypeFieldTool(config);

  return {
    getContentType: {
      title: 'get_content_type',
      description: 'Get details about a specific Contentful content type',
      inputParams: GetContentTypeToolParams.shape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
      tool: getContentType,
    },
    listContentTypes: {
      title: 'list_content_types',
      description:
        'List content types in a space. Returns a maximum of 10 items per request. Use skip parameter to paginate through results.',
      inputParams: ListContentTypesToolParams.shape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
      tool: listContentTypes,
    },
    createContentType: {
      title: 'create_content_type',
      description: 'Create a new content type',
      inputParams: CreateContentTypeToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: createContentType,
    },
    updateContentType: {
      title: 'update_content_type',
      description:
        'Update an existing content type. The handler will merge your field updates with existing content type data, so you only need to provide the fields and properties you want to change.',
      inputParams: UpdateContentTypeToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: updateContentType,
    },
    deleteContentType: {
      title: 'delete_content_type',
      description: 'Delete a content type',
      inputParams: DeleteContentTypeToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: deleteContentType,
    },
    publishContentType: {
      title: 'publish_content_type',
      description: 'Publish a content type',
      inputParams: PublishContentTypeToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: publishContentType,
    },
    unpublishContentType: {
      title: 'unpublish_content_type',
      description: 'Unpublish a content type',
      inputParams: UnpublishContentTypeToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: unpublishContentType,
    },
    omitContentTypeField: {
      title: 'omit_content_type_field',
      description:
        'Mark a single field as omitted (or un-omitted) on a content type. Updates the content type draft only — call publish_content_type afterwards for the change to take effect. Reversible via the same tool with omitted=false. This is a prerequisite for delete_content_type_field: the field must be omitted in the published version before it can be deleted.',
      inputParams: OmitContentTypeFieldToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: omitContentTypeField,
    },
    deleteContentTypeField: {
      title: 'delete_content_type_field',
      description:
        'Permanently mark a single field as deleted on a content type. Destructive and irreversible once published. Updates the content type draft only — call publish_content_type afterwards for the deletion to take effect. The field must not be required AND must already be omitted in the published version of the content type. Run omit_content_type_field, then publish_content_type, before calling this. Use disable_content_type_field to temporarily hide a field instead.',
      inputParams: DeleteContentTypeFieldToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: deleteContentTypeField,
    },
    disableContentTypeField: {
      title: 'disable_content_type_field',
      description:
        'Toggle the disabled and/or omitted flags on a single field. Setting disabled=true hides the field from the editor UI; setting omitted=true removes it from API responses. Both flags are reversible. Updates the content type draft only — call publish_content_type afterwards for the change to take effect. Use omit_content_type_field when only changing the omitted flag.',
      inputParams: DisableContentTypeFieldToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: disableContentTypeField,
    },
  };
}
