import { listTagsTool, ListTagsToolParams } from './listTags.js';
import { createTagTool, CreateTagToolParams } from './createTag.js';
import type { ContentfulConfig } from '../../config/types.js';

export function createTagTools(config: ContentfulConfig) {
  const listTags = listTagsTool(config);
  const createTag = createTagTool(config);

  return {
    listTags: {
      title: 'list_tags',
      description:
        'List all tags in a space. Returns all tags that exist in a given environment.',
      inputParams: ListTagsToolParams.shape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
      tool: listTags,
    },
    createTag: {
      title: 'create_tag',
      description:
        'Creates a new tag and returns it. Both name and ID must be unique to each environment. Tag names can be modified after creation, but the tag ID cannot. The tag visibility can be set to public or private, defaulting to private if not specified.',
      inputParams: CreateTagToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: createTag,
    },
  };
}
