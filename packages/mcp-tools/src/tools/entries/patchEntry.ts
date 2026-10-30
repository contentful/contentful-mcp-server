import { z } from 'zod';
import type { OpPatch } from 'contentful-management';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import {
  BaseToolSchema,
  createToolClient,
  assertEnvironmentNotProtected,
} from '../../utils/tools.js';
import type { ContentfulConfig } from '../../config/types.js';

// Only /fields/{fieldId}/{locale}[/...] may be patched. This keeps sys and
// metadata out of reach and prevents replacing a whole field (all locales).
const FIELD_LOCALE_PATH = /^\/fields\/[^/]+\/[^/]+(\/.*)?$/;

const PatchOperationSchema = z.object({
  op: z.enum(['add', 'replace', 'remove', 'test']),
  path: z
    .string()
    .regex(
      FIELD_LOCALE_PATH,
      'path must target a field locale, e.g. "/fields/title/en-US"',
    )
    .describe('JSON Pointer to a field locale, e.g. "/fields/title/en-US".'),
  value: z
    .unknown()
    .optional()
    .describe('The value to add, replace, or test. Omit for "remove".'),
});

export const PatchEntryToolParams = BaseToolSchema.extend({
  entryId: z.string().describe('The ID of the entry to patch'),
  operations: z
    .array(PatchOperationSchema)
    .min(1)
    .max(50)
    .describe(
      'JSON Patch operations applied in order. Only the listed field locales ' +
        'are touched; every other locale and field is left as is.',
    ),
  version: z
    .number()
    .optional()
    .describe(
      "Optional. The entry's sys.version as returned by get_entry. If provided, " +
        'the patch is rejected when the entry has changed since you read it. ' +
        'If omitted, the patch is applied against the current version, which is ' +
        'safe when operations only touch distinct field locales.',
    ),
});

type Params = z.infer<typeof PatchEntryToolParams>;

export function patchEntryTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      entryId: args.entryId,
    };

    const contentfulClient = createToolClient(config, args);

    // The CMA requires a version header; resolve it server-side when the
    // caller did not supply one so per-locale writes need no GET/merge cycle.
    const version =
      args.version ?? (await contentfulClient.entry.get(params)).sys.version;

    const updatedEntry = await contentfulClient.entry.patch(
      { ...params, version },
      args.operations as OpPatch[],
    );

    return createSuccessResponse('Entry patched successfully', {
      updatedEntry,
    });
  }

  return withErrorHandling(tool, 'Error patching entry');
}
