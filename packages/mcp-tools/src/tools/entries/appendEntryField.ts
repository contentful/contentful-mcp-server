import { z } from 'zod';
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

export const AppendEntryFieldToolParams = BaseToolSchema.extend({
  entryId: z.string().describe('The ID of the entry to modify'),
  fieldId: z.string().describe('The ID of the array field to append to'),
  locale: z
    .string()
    .describe(
      'The locale key to target (e.g. "en-US"). Fields are locale-keyed; ' +
        'you must supply the exact locale string.',
    ),
  values: z
    .array(z.unknown())
    .min(1)
    .describe(
      'One or more items to append. Each item must match the element shape ' +
        'of the target array field: a plain string for Array of Symbols, ' +
        '{ sys: { type: "Link", linkType: "Entry"|"Asset", id: "..." } } for ' +
        'Array of Links, or { sys: { type: "ResourceLink", linkType: "...", ' +
        'urn: "..." } } for Array of ResourceLinks.',
    ),
  version: z
    .number()
    .optional()
    .describe(
      'Optional. The entry\'s sys.version as returned by get_entry. ' +
        'If provided, the append is rejected when the entry has changed since ' +
        'you read it (same conflict check as update_entry). ' +
        'If omitted, the append targets the current server state without a ' +
        'version check — safe for additive operations.',
    ),
});

type Params = z.infer<typeof AppendEntryFieldToolParams>;

/**
 * Determine a deduplication key for an array item.
 * - Link: sys.id
 * - ResourceLink: sys.urn
 * - Primitive (Symbol): exact string value cast to string
 * Returns undefined for items that cannot be keyed (treated as always-new).
 */
function itemKey(item: unknown): string | undefined {
  if (item !== null && typeof item === 'object') {
    const sys = (item as Record<string, unknown>)['sys'];
    if (sys !== null && typeof sys === 'object') {
      const sysObj = sys as Record<string, unknown>;
      if (typeof sysObj['id'] === 'string') return `id:${sysObj['id']}`;
      if (typeof sysObj['urn'] === 'string') return `urn:${sysObj['urn']}`;
    }
  }
  if (typeof item === 'string') return `str:${item}`;
  return undefined;
}

export function appendEntryFieldTool(config: ContentfulConfig) {
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

    // Step 1: Fetch the current entry server-side (never truncated).
    const existingEntry = await contentfulClient.entry.get(params);

    // Step 2: Optional version conflict check — only when caller passes version.
    if (
      args.version !== undefined &&
      args.version !== existingEntry.sys.version
    ) {
      throw new Error(
        `Version conflict: the entry has changed since you read it ` +
          `(your version: ${args.version}, current version: ${existingEntry.sys.version}). ` +
          `Re-fetch the entry with get_entry and retry with the latest version.`,
      );
    }

    // Step 3: Resolve the current array for this field/locale.
    const fieldLocaleValue =
      existingEntry.fields?.[args.fieldId]?.[args.locale];

    // Step 4: Initialize absent field/locale as empty array; reject non-arrays.
    let existingArray: unknown[];
    if (fieldLocaleValue === undefined || fieldLocaleValue === null) {
      existingArray = [];
    } else if (!Array.isArray(fieldLocaleValue)) {
      throw new Error(
        `Field "${args.fieldId}" locale "${args.locale}" is not an array ` +
          `(got ${typeof fieldLocaleValue}). append_entry_field only works on ` +
          `Array of Symbols, Array of Links, and Array of ResourceLinks fields.`,
      );
    } else {
      existingArray = fieldLocaleValue as unknown[];
    }

    // Step 5: Deduplicate — collect existing keys once, then filter incoming values.
    const existingKeys = new Set<string>();
    for (const item of existingArray) {
      const k = itemKey(item);
      if (k !== undefined) existingKeys.add(k);
    }

    const appended: unknown[] = [];
    const skipped: unknown[] = [];
    for (const incoming of args.values) {
      const k = itemKey(incoming);
      if (k !== undefined && existingKeys.has(k)) {
        skipped.push(incoming);
      } else {
        appended.push(incoming);
        if (k !== undefined) existingKeys.add(k); // guard against dupes within args.values
      }
    }

    const newArray = [...existingArray, ...appended];

    // Step 6: Write back — merge only the target field/locale; leave everything
    // else (other fields, other locales within this field) completely untouched.
    const updatedFields = {
      ...existingEntry.fields,
      [args.fieldId]: {
        ...(existingEntry.fields?.[args.fieldId] ?? {}),
        [args.locale]: newArray,
      },
    };

    const updatedEntry = await contentfulClient.entry.update(params, {
      ...existingEntry,
      fields: updatedFields,
    });

    return createSuccessResponse('Entry field appended successfully', {
      updatedEntry,
      appended,
      skipped,
      newLength: newArray.length,
    });
  }

  return withErrorHandling(tool, 'Error appending entry field');
}
