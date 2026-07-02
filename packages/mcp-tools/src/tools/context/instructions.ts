/**
 * Contentful MCP operating guidance, split into two tiers:
 *
 * - CORE_INVARIANTS: small, load-bearing rules whose absence causes failures.
 *   Returned inline by get_initial_context on every session.
 * - GUIDANCE: verbose, task-specific elaboration served on demand by
 *   get_guidance(topic).
 *
 * All content is verified against the actual registered tool surface
 * (audit 2026-07-02). Do not reintroduce fictional tool names or limits;
 * instructions.test.ts guards against regressions.
 */

export const GUIDANCE_TOPICS = ['searching', 'editing', 'conventions'] as const;

export type GuidanceTopic = (typeof GUIDANCE_TOPICS)[number];

export const CORE_INVARIANTS = `# Core operating rules

- **Content-type first.** Before finding or editing content, call \`list_content_types\` to see what content types exist, and \`get_content_type\` to inspect a type's fields. This prevents failed queries and reveals the right type (e.g. a \`pricingPage\` type when asked about pricing).
- **Edit safely.** To modify an entry, call \`get_entry\` first, then pass the returned \`sys.version\` to \`update_entry\`. The version is required and prevents overwriting concurrent changes.
- **Bulk cap.** The bulk operations \`publish_entry\`, \`unpublish_entry\`, \`archive_entry\`, and \`unarchive_entry\` accept at most 10 IDs per call by default. This cap does not apply to creating or updating entries.
- **Ask when ambiguous.** If multiple spaces or environments are available, ask the user which to use. Do not guess.

For deeper guidance, call \`get_guidance\` with one of: ${GUIDANCE_TOPICS.map((t) => `\`${t}\``).join(', ')}.`;

export const GUIDANCE: Record<GuidanceTopic, string> = {
  searching: `# Searching for content

- **Content-type first.** When users ask about specific content ("pricing page", "blog posts"), call \`list_content_types\` / \`get_content_type\` to discover the correct type before searching. This prevents wasted queries on wrong field names.
- **Then search.** Use \`search_entries\` with the correct content type and field names. Use \`semantic_search\` when the user's request is conceptual rather than an exact field match.
- **Retry thoughtfully.** If a query returns no results, retry 2-3 times: relax filters, use more general terms, or check for typos in field names.
- **Multi-step reference queries.** For requests like "blog posts by Magnus", first inspect the content type to confirm the reference field, then query for the referenced entry (the author) to get its ID, then query the primary content filtering on that ID. If several entities match, show them all and ask.`,

  editing: `# Editing and entry lifecycle

Each operation is its own tool — there is no single "entry action" tool.

- **Create:** \`create_entry\` creates one entry per call, following the content type's field structure. If a requested field does not match the type (e.g. "writer" when the type has "author"), suggest the correct field.
- **Update:** \`update_entry\` modifies content. Always call \`get_entry\` first and pass the returned \`sys.version\` — it is required and prevents version conflicts.
- **Delete:** \`delete_entry\` removes an entry.
- **Publish state:** \`publish_entry\`, \`unpublish_entry\`, \`archive_entry\`, \`unarchive_entry\` manage lifecycle. These accept up to 10 IDs per call by default.
- **Verify first.** Confirm an entry exists before modifying it. Remind users that publish/unpublish affects live content.`,

  conventions: `# Response and workflow conventions

- **Plan, then act.** Before a tool call, think about what you need, pick the right tool, and briefly tell the user what you are about to do.
- **Persist.** Keep going until the request is fully resolved; do not stop at the first error. On failure, explain what went wrong and immediately try a different approach — never apologize for tool errors.
- **Clarify resources.** If multiple spaces or environments exist, always ask which to use before acting.
- **Format for readability.** Use markdown for complex data; show the most important fields of an entry first; keep responses concise but complete.
- **Prefer bulk.** If you would call the same tool many times, check whether it supports multiple IDs and condense into one call (respecting the 10-ID cap on publish-family operations).`,
};

/** @deprecated temporary shim; removed in the get_initial_context rewrite. */
export const MCP_INSTRUCTIONS = CORE_INVARIANTS;
