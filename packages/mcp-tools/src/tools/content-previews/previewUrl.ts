import { cloneDeep, get } from 'lodash-es';

/**
 * Resolution of Content Preview URL templates.
 *
 * This is a port of the token grammar the web app uses (via the internal
 * `@contentful/experience-content-preview` package) so that MCP clients get the
 * same link an editor would get from the Content Preview dropdown. The internal
 * package cannot be depended on here: it is UNLICENSED and published to GitHub
 * Packages, while this package ships to the public npm registry under MIT.
 *
 * One deliberate difference: the web app substitutes `<path>_NOT_FOUND` for
 * tokens it cannot resolve. That would hand an agent a silently broken link, so
 * unresolved tokens are left in place and reported back to the caller instead.
 */

/** `{locale}` is resolved before every other token, exactly as the web app does. */
const LOCALE_TOKEN = /{\s*locale\s*}/g;
/** Any `{ some.path }` token. Group 1 is the raw (possibly padded) path. */
const TOKEN = /{(\s*([\S]+?)\s*)}/g;
/** A whole placeholder, used only to count `linkedBy` hops. */
const PLACEHOLDER = /\{.*?\}/g;
const LINKED_BY = /linkedBy/g;
/** e.g. `entry.fields.reference.en-US.sys.contentType.sys.id` */
const NESTED_REFERENCE = /^entry\.fields\.\w+\.[a-zA-Z-]+\.(fields|sys)/;
const NESTED_REFERENCE_PREFIX = /^entry\.fields\.\w+\.[a-zA-Z-]+\./;
/** A second `fields.<x>.fields` hop would mean loading yet another entry. */
const SECOND_REFERENCE_HOP = /fields\.[a-zA-Z]+\.fields/;

export type PreviewEntryContext = {
  sys: Record<string, unknown> & { id: string };
  fields: Record<string, unknown>;
  linkedBy?: PreviewEntryContext;
};

export type ResolvePreviewUrlOptions = {
  /** The configured URL template. */
  template: string;
  entry: PreviewEntryContext;
  environmentId: string;
  /** Locale used to unwrap localized field values. */
  defaultLocaleCode: string;
  /** Locale substituted into `{locale}`. Falls back to the default locale. */
  currentLocaleCode?: string;
  /** Loads a linked entry by ID. Enables one hop of reference tokens. */
  getEntry?: (entryId: string) => Promise<PreviewEntryContext | undefined>;
  /** Loads the first entry linking to `entryId`. Enables `linkedBy` tokens. */
  getIncomingLink?: (
    entryId: string,
  ) => Promise<PreviewEntryContext | undefined>;
};

export type ResolvedPreviewUrl = {
  /** The template with every resolvable token substituted. */
  url: string;
  /** Token paths left in the URL because no value could be resolved. */
  unresolvedTokens: string[];
};

type TokenContext = {
  entry: PreviewEntryContext;
  env_id: string;
  /** Legacy aliases kept for parity with the web app's resolver. */
  entry_id: string;
  entry_field: Record<string, unknown>;
};

/**
 * Inserts the locale into a field path, mirroring how the CMA nests localized
 * values: `entry.fields.author.sys.id` becomes
 * `entry.fields.author.<locale>.sys.id`. Paths that stop at the field itself
 * (`entry.fields.slug`) are returned unchanged and unwrapped later.
 */
export function addLocale(path: string, locale: string): string {
  const fieldsIndex = path.indexOf('fields');
  if (fieldsIndex === -1) {
    return path;
  }

  // Skip past `fields.` before looking for the separator after the field name.
  const separatorIndex = path.indexOf('.', fieldsIndex + 'fields'.length + 1);
  if (separatorIndex === -1) {
    return path;
  }

  return `${path.slice(0, separatorIndex + 1)}${locale}.${path.slice(separatorIndex + 1)}`;
}

/**
 * How many levels of incoming links the template needs. `{entry.linkedBy.sys.id}`
 * needs one, `{entry.linkedBy.linkedBy.fields.slug}` needs two.
 */
export function countIncomingLinkHops(template: string): number {
  const placeholders = template.match(PLACEHOLDER) ?? [];
  if (placeholders.length === 0) {
    return 0;
  }

  return Math.max(
    ...placeholders.map(
      (placeholder) => (placeholder.match(LINKED_BY) ?? []).length,
    ),
  );
}

function isEntryLink(value: unknown): value is { sys: { id: string } } {
  const sys = (value as { sys?: { type?: string; linkType?: string } })?.sys;
  return sys?.type === 'Link' && sys?.linkType === 'Entry';
}

function asTokenValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

/**
 * Unwraps a localized value (`{ 'en-US': 'slug' }`) and rejects anything that
 * is not a scalar — embedding `[object Object]` in a preview link is never what
 * the editor wants.
 */
function unwrapValue(
  value: unknown,
  defaultLocaleCode: string,
): string | undefined {
  if (value !== null && typeof value === 'object') {
    return asTokenValue((value as Record<string, unknown>)[defaultLocaleCode]);
  }

  return asTokenValue(value);
}

async function readContextPath(
  path: string,
  context: TokenContext,
  getEntry: ResolvePreviewUrlOptions['getEntry'],
): Promise<unknown> {
  if (getEntry && NESTED_REFERENCE.test(path)) {
    const prefix = NESTED_REFERENCE_PREFIX.exec(path)?.[0];
    // Drop the trailing dot to get the path of the reference field itself.
    const referencePath = prefix?.slice(0, -1);

    if (referencePath) {
      const nestedPath = path.slice(referencePath.length + 1);

      if (SECOND_REFERENCE_HOP.test(nestedPath)) {
        return undefined;
      }

      const link: unknown = get(context, referencePath);
      if (isEntryLink(link)) {
        const nestedEntry = await getEntry(link.sys.id);
        return nestedEntry ? get(nestedEntry, nestedPath) : undefined;
      }
    }
  }

  return get(context, path);
}

async function attachIncomingLinks(
  entry: PreviewEntryContext,
  template: string,
  getIncomingLink: ResolvePreviewUrlOptions['getIncomingLink'],
): Promise<void> {
  const hops = countIncomingLinkHops(template);
  if (hops === 0 || !getIncomingLink) {
    return;
  }

  const seen = new Map<string, PreviewEntryContext | undefined>();
  let current = entry;

  for (let hop = 0; hop < hops; hop += 1) {
    const entryId = current.sys.id;
    if (!seen.has(entryId)) {
      seen.set(entryId, await getIncomingLink(entryId));
    }

    const linkedBy = seen.get(entryId);
    if (!linkedBy) {
      return;
    }

    current.linkedBy = cloneDeep(linkedBy);
    current = current.linkedBy;
  }
}

/**
 * Substitutes entry data into a Content Preview URL template.
 *
 * Supported tokens: `{locale}`, `{env_id}`, `{entry_id}`, `{entry_field.<field>}`,
 * `{entry.sys.*}`, `{entry.fields.<field>}` (localized), one hop of reference
 * traversal (`{entry.fields.parent.sys.id}`), and `{entry.linkedBy...}` incoming
 * links. Timeline, release, variant, and custom-variable tokens are not
 * resolved and are reported through `unresolvedTokens`.
 */
export async function resolvePreviewUrl(
  options: ResolvePreviewUrlOptions,
): Promise<ResolvedPreviewUrl> {
  const {
    template,
    environmentId,
    defaultLocaleCode,
    currentLocaleCode,
    getEntry,
    getIncomingLink,
  } = options;

  const entry = cloneDeep(options.entry);
  await attachIncomingLinks(entry, template, getIncomingLink);

  const context: TokenContext = {
    entry,
    env_id: environmentId,
    entry_id: entry.sys.id,
    entry_field: entry.fields,
  };

  let url = template.replace(
    LOCALE_TOKEN,
    currentLocaleCode ?? defaultLocaleCode,
  );

  const unresolvedTokens: string[] = [];

  for (const [token, rawPath] of [...url.matchAll(TOKEN)]) {
    const path = rawPath?.trim() || token;
    const raw = await readContextPath(
      addLocale(path, defaultLocaleCode),
      context,
      getEntry,
    );
    const value = unwrapValue(raw, defaultLocaleCode);

    if (value === undefined) {
      if (!unresolvedTokens.includes(path)) {
        unresolvedTokens.push(path);
      }
      continue;
    }

    // Replace via a function so `$&`-style sequences in field values are literal.
    url = url.replace(token, () => value);
  }

  return { url, unresolvedTokens };
}
