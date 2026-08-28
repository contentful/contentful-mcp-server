import {
  listContentPreviewsTool,
  ListContentPreviewsToolParams,
} from './listContentPreviews.js';
import {
  getEntryPreviewUrlTool,
  GetEntryPreviewUrlToolParams,
} from './getEntryPreviewUrl.js';
import type { ContentfulConfig } from '../../config/types.js';

export function createContentPreviewTools(config: ContentfulConfig) {
  const listContentPreviews = listContentPreviewsTool(config);
  const getEntryPreviewUrl = getEntryPreviewUrlTool(config);

  return {
    listContentPreviews: {
      title: 'list_content_previews',
      description:
        'List the content previews (Settings → Content Preview) configured for a space, including the URL template for each content type. URL templates can contain secret tokens, so treat the output as sensitive.',
      inputParams: ListContentPreviewsToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: listContentPreviews,
    },
    getEntryPreviewUrl: {
      title: 'get_entry_preview_url',
      description:
        "Resolve the draft-preview URL for an entry by substituting the entry's data into the content preview URL template configured for its content type. Returns the same link an editor would get from the Content Preview dropdown in the entry editor, plus any tokens that could not be resolved.",
      inputParams: GetEntryPreviewUrlToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: getEntryPreviewUrl,
    },
  };
}
