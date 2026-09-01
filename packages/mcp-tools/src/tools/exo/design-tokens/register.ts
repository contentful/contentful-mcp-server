import {
  getDesignTokenTool,
  GetDesignTokenToolParams,
} from './getDesignToken.js';
import {
  listDesignTokensTool,
  ListDesignTokensToolParams,
} from './listDesignTokens.js';
import {
  upsertDesignTokenTool,
  UpsertDesignTokenToolParams,
} from './upsertDesignToken.js';
import {
  deleteDesignTokenTool,
  DeleteDesignTokenToolParams,
} from './deleteDesignToken.js';
import type { ContentfulConfig } from '../../../config/types.js';

export function createDesignTokenTools(config: ContentfulConfig) {
  const getDesignToken = getDesignTokenTool(config);
  const listDesignTokens = listDesignTokensTool(config);
  const upsertDesignToken = upsertDesignTokenTool(config);
  const deleteDesignToken = deleteDesignTokenTool(config);

  return {
    getDesignToken: {
      title: 'get_design_token',
      description:
        'Get details about a specific ExO design token (a named DTCG-typed value, such as a color, dimension, or typography token, referenced by token-backed design properties on components).',
      inputParams: GetDesignTokenToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: getDesignToken,
    },
    listDesignTokens: {
      title: 'list_design_tokens',
      description:
        'List ExO design tokens in a space and environment. Returns a maximum of 10 items per request; use the pageNext cursor (returned in pages.next) to paginate.',
      inputParams: ListDesignTokensToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: listDesignTokens,
    },
    upsertDesignToken: {
      title: 'upsert_design_token',
      description:
        'Create or update an ExO design token. To update an existing token, call get_design_token first and pass the returned sys.version as the version parameter; the handler merges your updates with the existing fields, so you only need to provide what changes. If the version is stale, the update is rejected and you must re-fetch with get_design_token. To create a new token, omit version and supply designTokenId, name, and type. Design tokens have no separate publish step: every upsert auto-publishes server-side, bumping sys.version by 2 (not 1) per call.',
      inputParams: UpsertDesignTokenToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: upsertDesignToken,
    },
    deleteDesignToken: {
      title: 'delete_design_token',
      description:
        'Delete an ExO design token. Two-phase: the first call (without confirm/confirmToken) returns a preview and a confirmToken. To complete the deletion, call again with the same designTokenId, confirm: true, and the confirmToken from the preview.',
      inputParams: DeleteDesignTokenToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: deleteDesignToken,
    },
  };
}
