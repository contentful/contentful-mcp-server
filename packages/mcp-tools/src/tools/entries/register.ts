import { searchEntriesTool, SearchEntriesToolParams } from './searchEntries.js';
import { createEntryTool, CreateEntryToolParams } from './createEntry.js';
import { deleteEntryTool, DeleteEntryToolParams } from './deleteEntry.js';
import { updateEntryTool, UpdateEntryToolParams } from './updateEntry.js';
import { getEntryTool, GetEntryToolParams } from './getEntry.js';
import {
  resolveEntryReferencesTool,
  ResolveEntryReferencesToolParams,
} from './resolveEntryReferences.js';
import { publishEntryTool, PublishEntryToolParams } from './publishEntry.js';
import {
  unpublishEntryTool,
  UnpublishEntryToolParams,
} from './unpublishEntry.js';
import { archiveEntryTool, ArchiveEntryToolParams } from './archiveEntry.js';
import {
  unarchiveEntryTool,
  UnarchiveEntryToolParams,
} from './unarchiveEntry.js';
import type { ContentfulConfig } from '../../config/types.js';

export function createEntryTools(config: ContentfulConfig) {
  const searchEntries = searchEntriesTool(config);
  const createEntry = createEntryTool(config);
  const deleteEntry = deleteEntryTool(config);
  const updateEntry = updateEntryTool(config);
  const getEntry = getEntryTool(config);
  const resolveEntryReferences = resolveEntryReferencesTool(config);
  const publishEntry = publishEntryTool(config);
  const unpublishEntry = unpublishEntryTool(config);
  const archiveEntry = archiveEntryTool(config);
  const unarchiveEntry = unarchiveEntryTool(config);

  return {
    searchEntries: {
      title: 'search_entries',
      description: 'Search for specific entries in your Contentful space',
      inputParams: SearchEntriesToolParams.shape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
      tool: searchEntries,
    },
    createEntry: {
      title: 'create_entry',
      description:
        "Create a new entry in Contentful. Before executing this function, you need to know the contentTypeId (not the content type NAME) and the fields of that contentType. You can get the fields definition by using the GET_CONTENT_TYPE tool. TAGS: To add tags to an entry, include a metadata object with a tags array. Each tag should be an object with sys.type='Link', sys.linkType='Tag', and sys.id='tagId'. Example: { metadata: { tags: [{ sys: { type: 'Link', linkType: 'Tag', id: 'myTagId' } }] } }.",
      inputParams: CreateEntryToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: createEntry,
    },
    getEntry: {
      title: 'get_entry',
      description: 'Retrieve an existing entry',
      inputParams: GetEntryToolParams.shape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
      tool: getEntry,
    },
    resolveEntryReferences: {
      title: 'resolve_entry_references',
      description:
        "Recursively resolve an entry's references and return the entry plus its descendant entries and linked assets. Useful for verifying the structure of a page or any entry that links to other entries before or after edits, without issuing one fetch per descendant. Set `include` (1-10, default 2) to control how many levels deep to walk; the CMA caps this at 10.",
      inputParams: ResolveEntryReferencesToolParams.shape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
      tool: resolveEntryReferences,
    },
    updateEntry: {
      title: 'update_entry',
      description:
        'Update an existing entry. You MUST call get_entry first to read the current state, then pass the sys.version you received as the version parameter. The handler merges your field updates with the existing entry fields, so you only need to provide the fields you want to change. However, for multiple-locale fields, all existing locales must be included in the update. If the version is stale (the entry changed since you read it), the update is rejected and you must re-fetch with get_entry.',
      inputParams: UpdateEntryToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: updateEntry,
    },
    deleteEntry: {
      title: 'delete_entry',
      description:
        'Delete a specific content entry from your Contentful space. This is a two-phase operation: the first call (without confirm/confirmToken) returns a preview of the entry and a confirmToken. To complete the deletion, call this tool again with the same entryId, confirm: true, and the confirmToken from the preview response.',
      inputParams: DeleteEntryToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: deleteEntry,
    },
    publishEntry: {
      title: 'publish_entry',
      description:
        'Publish an entry or multiple entries. Accepts either a single entryId (string) or an array of entryIds (up to 100 entries). For a single entry, it uses the standard publish operation. For multiple entries, it automatically uses bulk publishing.',
      inputParams: PublishEntryToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: publishEntry,
    },
    unpublishEntry: {
      title: 'unpublish_entry',
      description:
        'Unpublish an entry or multiple entries. Accepts either a single entryId (string) or an array of entryIds (up to 100 entries). For a single entry, it uses the standard unpublish operation. For multiple entries, it automatically uses bulk unpublishing.',
      inputParams: UnpublishEntryToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: unpublishEntry,
    },
    archiveEntry: {
      title: 'archive_entry',
      description:
        'Archive an entry or multiple entries. Archives entries that are no longer needed but should be preserved. Entries must be unpublished before they can be archived. Accepts either a single entryId (string) or an array of entryIds (up to 100 entries). For multiple entries, processes each one sequentially as a pseudo-bulk operation.',
      inputParams: ArchiveEntryToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: archiveEntry,
    },
    unarchiveEntry: {
      title: 'unarchive_entry',
      description:
        'Unarchive an entry or multiple entries. Restores archived entries, making them available for editing and publishing again. Accepts either a single entryId (string) or an array of entryIds (up to 100 entries). For multiple entries, processes each one sequentially as a pseudo-bulk operation.',
      inputParams: UnarchiveEntryToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: unarchiveEntry,
    },
  };
}
