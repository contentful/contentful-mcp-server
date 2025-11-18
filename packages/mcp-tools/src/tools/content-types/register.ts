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

export const contentTypeTools = {
  getContentType: {
    title: 'get_content_type',
    description: 'Get details about a specific Contentful content type',
    inputParams: GetContentTypeToolParams.shape,
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
    tool: getContentTypeTool,
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
    tool: listContentTypesTool,
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
    tool: createContentTypeTool,
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
    tool: updateContentTypeTool,
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
    tool: deleteContentTypeTool,
  },
  publishContentType: {
    title: 'publish_content_type',
    description: 'Publish a content type',
    inputParams: PublishContentTypeToolParams.shape,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    tool: publishContentTypeTool,
  },
  unpublishContentType: {
    title: 'unpublish_content_type',
    description: 'Unpublish a content type',
    inputParams: UnpublishContentTypeToolParams.shape,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    tool: unpublishContentTypeTool,
  },
};
