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
  omitAndDeleteContentTypeFieldTool,
  OmitAndDeleteContentTypeFieldToolParams,
} from './omitAndDeleteContentTypeField.js';
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
  const omitAndDeleteContentTypeField =
    omitAndDeleteContentTypeFieldTool(config);
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
    omitAndDeleteContentTypeField: {
      title: 'omit_and_delete_content_type_field',
      description:
        'Permanently delete a field from a content type by omitting it, publishing the change, then marking it deleted. This is a destructive, irreversible operation. The field must not be required. Use disable_content_type_field to temporarily hide a field instead.',
      inputParams: OmitAndDeleteContentTypeFieldToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: omitAndDeleteContentTypeField,
    },
    disableContentTypeField: {
      title: 'disable_content_type_field',
      description:
        'Disable or omit a single field on a content type without deleting it. Setting disabled=true hides the field in the editor UI. Setting omitted=true removes it from API responses. Both can be set at once. These changes are reversible.',
      inputParams: DisableContentTypeFieldToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: disableContentTypeField,
    },
  };
}
