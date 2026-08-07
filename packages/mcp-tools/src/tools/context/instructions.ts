/**
 * Contentful MCP operating guidance, returned in full by get_initial_context
 * on every session.
 *
 * All content is verified against the actual registered tool surface
 * (audit 2026-07-02). Do not reintroduce fictional tool names or limits;
 * instructions.test.ts guards against regressions.
 */

export const CORE_INVARIANTS = `# Core operating rules

- **Schema first.** Before creating or finding content, inspect the environment's schema: list available types and inspect their fields. This prevents failed operations and ensures you use the right type and field names.
- **Edit safely.** Before updating any item, fetch it first to get the current \`sys.version\`, then pass that version to the update call. The version is required and prevents overwriting concurrent changes.
- **Bulk cap.** Bulk publish/unpublish/archive/unarchive operations accept at most 10 IDs per call by default. This cap does not apply to creating or updating items.
- **Ask when ambiguous.** If multiple spaces or environments are available, ask the user which to use. Do not guess.`;

export const SEARCHING_GUIDANCE = `# Searching for content

- **Schema first.** When users ask about specific content, discover the relevant schema before searching: list the environment's available types and inspect a type's fields so you query on real field names. This prevents wasted queries. Use whichever primitives the environment exposes — classic content types and entries, or Experience Orchestration components and experiences.
- **Then search.** Query using the correct type and field names. Prefer semantic search when the request is conceptual rather than an exact field match.
- **Retry thoughtfully.** If a query returns no results, retry 2-3 times: relax filters, use more general terms, or check for typos in field names.
- **Multi-step reference queries.** For requests that span references (e.g. "posts by Magnus"), first inspect the schema to confirm the reference field, then query for the referenced item to get its ID, then filter the primary query on that ID. If several items match, show them all and ask.`;

export const CONVENTIONS_GUIDANCE = `# Response and workflow conventions

- **Plan, then act.** Before a tool call, think about what you need, pick the right tool, and briefly tell the user what you are about to do.
- **Persist.** Keep going until the request is fully resolved; do not stop at the first error. On failure, explain what went wrong and immediately try a different approach — never apologize for tool errors.
- **Clarify resources.** If multiple spaces or environments exist, always ask which to use before acting.
- **Format for readability.** Use markdown for complex data; show the most important fields of an entry first; keep responses concise but complete.
- **Prefer bulk.** If you would call the same tool many times, check whether it supports multiple IDs and condense into one call (respecting the 10-ID cap on publish-family operations).`;

export const EXO_DISPOSITION = `# Tool disposition: Experience Orchestration by default

Experience Orchestration (ExO) tools are enabled. Use ExO primitives — Components, Experiences, Experience Templates, Experience Fragments, and Data Assemblies — for all content modeling and authoring. Do not create classic content types or entries unless the user explicitly instructs you to. If you are unsure how to model something with ExO, inspect the tool schemas and proceed with ExO.`;
