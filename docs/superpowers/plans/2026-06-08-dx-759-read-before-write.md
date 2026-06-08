# DX-759: Enforce "read before write" in update_entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `update_entry` require a `version` parameter (obtained from a prior `get_entry` call) and reject the update with a clear conflict error when that version is stale, guaranteeing the LLM has read the entry's current state before writing.

**Architecture:** `update_entry` already performs a server-side `entry.get()` + shallow field merge, but the LLM never sees that read and never proves it read the entry. We add a **required** `version: number` param to the tool schema. The handler still fetches the existing entry (needed for the merge and to know the true current version), then compares the caller-supplied `version` against `existingEntry.sys.version`. On mismatch it throws a descriptive conflict error instructing the LLM to re-fetch via `get_entry`. This delivers true read-before-write enforcement *and* optimistic-locking protection against the concurrent-edit lost-update problem (a documented customer pain point).

**Tech Stack:** TypeScript, Zod (schema/validation), Vitest (tests), nx monorepo, `contentful-management` SDK plain client.

---

## Context & Background

- **Ticket:** [DX-759](https://contentful.atlassian.net/browse/DX-759) — "[post-GA] Enforce 'read before write' in the update_entry tool". Source: [contentful-mcp-server#321](https://github.com/contentful/contentful-mcp-server/issues/321).
- **Decision made during planning:** `version` is **required** (breaking change to the tool contract) — this is what literally *enforces* read-before-write. An LLM that skips `get_entry` cannot satisfy the schema and is forced to read first.
- **Why the ticket's literal ask is already done:** `updateEntry.ts:41` already calls `contentfulClient.entry.get()` and merges fields server-side. The remaining real gaps are (a) the LLM never sees that read, and (b) the internal read always grabs the freshest `sys.version`, so concurrent edits are silently overwritten (never a 409). The version gate closes both.
- **Approach chosen:** Required `version` param + validation against current server version + strengthened tool description and server instructions.

### Key Files

| File | Responsibility | Change |
|------|----------------|--------|
| `packages/mcp-tools/src/tools/entries/updateEntry.ts` | The tool: schema + handler | Add required `version` to schema; add version-conflict check in handler |
| `packages/mcp-tools/src/tools/entries/updateEntry.test.ts` | Unit tests (Vitest) | Update existing tests to pass `version`; add conflict-path tests |
| `packages/mcp-tools/src/tools/entries/register.ts:63-75` | Tool registration + description string | Update `update_entry` description to instruct calling `get_entry` first and passing `version` |
| `packages/mcp-tools/src/tools/context/instructions.ts:51` | Server-level LLM guidance | Strengthen the `update_entry` guidance line |

### Conventions to follow

- **Tests:** Vitest. Mock the client via `setupMockClient()` / `mockEntryGet` / `mockEntryUpdate` from `./mockClient.js`. Assert on the result of `formatResponse(...)`. See existing tests in `updateEntry.test.ts`.
- **Error style:** Throw a plain `Error`; `withErrorHandling(tool, 'Error updating entry')` wraps it into `{ isError: true, content: [{ type: 'text', text: 'Error updating entry: <message>' }] }`.
- **Commits:** Conventional commits. Release is automated from commit messages (commit-driven `chore(release): publish`). A required new param is a breaking change — use a `feat` commit with a `BREAKING CHANGE:` footer. **No manual changeset or version-bump step.**
- **`mockEntry.sys.version` is `1`** (see `mockClient.ts:67`). Tests pass `version: 1` for the happy path.

### Reference: current handler (`updateEntry.ts`, before changes)

```typescript
export const UpdateEntryToolParams = BaseToolSchema.extend({
  entryId: z.string().describe('The ID of the entry to update'),
  fields: entryFieldsSchema.describe(
    'The field values to update. Keys should be field IDs and values should be the field content. Will be merged with existing fields.',
  ),
  metadata: EntryMetadataSchema,
});

// ...inside tool(), after createToolClient:
const existingEntry = await contentfulClient.entry.get(params);
// merge + entry.update(...)
```

---

## Task 1: Add required `version` param and conflict check to update_entry

**Files:**
- Modify: `packages/mcp-tools/src/tools/entries/updateEntry.ts`
- Test: `packages/mcp-tools/src/tools/entries/updateEntry.test.ts`

- [ ] **Step 1: Update existing happy-path tests to supply `version`, and run them to confirm they now FAIL**

The schema does not yet have `version`, and the handler does not yet check it — but Zod with an unknown-but-required field will reject. We are writing the tests first (TDD): they will fail until the schema/handler change lands.

In `updateEntry.test.ts`, add `version: 1` to the `testArgs` of every existing test that currently calls the tool and expects success. There are 5 success-path `testArgs` objects to update (the "fields only", "metadata tags", "rich text multiple locales", "rich text embedded/inline", and "empty fields" tests). For each, add the `version` key alongside `entryId`:

```typescript
const testArgs = {
  ...mockArgs,
  entryId: 'test-entry-id',
  version: 1, // matches mockEntry.sys.version
  fields: {
    title: { 'en-US': 'Updated Title' },
    description: { 'en-US': 'Updated Description' },
  },
};
```

Apply the same `version: 1` addition to the other 4 success-path `testArgs` objects.

For the two error-path tests that should still reach the handler ("handle errors when entry update fails" sends a bad entryId then `mockEntryGet.mockRejectedValue`; "handle errors when entry retrieval succeeds but update fails"), also add `version: 1` so they exercise the intended code path rather than failing on schema validation. The "protected environment" test passes `fields: {}` with no version today — add `version: 1` there too so the protection check (which runs first) remains the thing under test.

> Note: these tests call the tool function directly with a plain object; Zod parsing happens at the MCP registration boundary, not inside `tool()`. So adding `version` to the handler logic (Step 3) — specifically the conflict check — is what makes/breaks these. The happy-path tests will fail at Step 2 only once the conflict check exists and `version` is absent; since we add `version: 1` here they will PASS after Step 3. To get a true RED first, Step 1b below adds a brand-new failing test for the conflict path.

- [ ] **Step 1b: Add a new failing test for the version-conflict path**

Add this test inside the `describe('updateEntry', ...)` block in `updateEntry.test.ts`:

```typescript
it('should return a version conflict error when the supplied version is stale', async () => {
  const testArgs = {
    ...mockArgs,
    entryId: 'test-entry-id',
    version: 1, // what the LLM read earlier
    fields: {
      title: { 'en-US': 'Updated Title' },
    },
  };

  // Server now has a newer version than what the caller supplied
  const mockExistingEntry = {
    ...mockEntry,
    sys: { ...mockEntry.sys, version: 3 },
    fields: { title: { 'en-US': 'Original Title' } },
    metadata: { tags: [] },
  };

  mockEntryGet.mockResolvedValue(mockExistingEntry);

  const tool = updateEntryTool(mockConfig);
  const result = await tool(testArgs);

  expect(result).toEqual({
    isError: true,
    content: [
      {
        type: 'text',
        text: 'Error updating entry: Version conflict: the entry has changed since you read it (your version: 1, current version: 3). Re-fetch the entry with get_entry and retry the update with the latest version.',
      },
    ],
  });
  // Must NOT attempt the write when the version is stale
  expect(mockEntryUpdate).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the new conflict test to verify it FAILS**

Run: `cd packages/mcp-tools && npx vitest run src/tools/entries/updateEntry.test.ts -t "version conflict"`

Expected: FAIL — currently the handler does not compare versions, so it would proceed to call `entry.update` (and `mockEntryUpdate` is undefined-returning), so the assertion on the conflict error message will not match.

- [ ] **Step 3: Add `version` to the schema and the conflict check to the handler**

In `updateEntry.ts`, update the schema to add a required `version`:

```typescript
export const UpdateEntryToolParams = BaseToolSchema.extend({
  entryId: z.string().describe('The ID of the entry to update'),
  version: z
    .number()
    .describe(
      "REQUIRED. The entry's sys.version as returned by get_entry. " +
        'You must call get_entry first to read the current state and version. ' +
        'The update is rejected if this does not match the entry’s current ' +
        'version, which means the entry changed since you read it.',
    ),
  fields: entryFieldsSchema.describe(
    'The field values to update. Keys should be field IDs and values should be the field content. Will be merged with existing fields.',
  ),
  metadata: EntryMetadataSchema,
});
```

Then, in the handler, add the conflict check immediately after the existing `entry.get` call and before the merge:

```typescript
const contentfulClient = createToolClient(config, args);

// First, get the existing entry
const existingEntry = await contentfulClient.entry.get(params);

// Enforce read-before-write: the caller must supply the version it read.
// Reject stale writes so concurrent edits are not silently overwritten.
if (args.version !== existingEntry.sys.version) {
  throw new Error(
    `Version conflict: the entry has changed since you read it ` +
      `(your version: ${args.version}, current version: ${existingEntry.sys.version}). ` +
      `Re-fetch the entry with get_entry and retry the update with the latest version.`,
  );
}

// Merge the provided fields with existing fields
const mergedFields = {
  ...existingEntry.fields,
  ...args.fields,
};
```

Leave the rest of the handler (merge, `entry.update`, success response) unchanged.

- [ ] **Step 4: Run the conflict test to verify it PASSES**

Run: `cd packages/mcp-tools && npx vitest run src/tools/entries/updateEntry.test.ts -t "version conflict"`

Expected: PASS

- [ ] **Step 5: Run the full updateEntry test file**

Run: `cd packages/mcp-tools && npx vitest run src/tools/entries/updateEntry.test.ts`

Expected: PASS — all success-path tests (now supplying `version: 1`, which matches `mockEntry.sys.version`) pass; the two handler error-path tests pass; the protected-environment test passes; the new conflict test passes.

If a success-path test fails because its `mockExistingEntry` overrides `sys` without `version`, ensure that mock's `sys.version` is `1` (the tests spread `...mockEntry`, so `sys.version: 1` is inherited unless overridden — verify none of them set a different version).

- [ ] **Step 6: Typecheck**

Run: `cd packages/mcp-tools && npx tsc --noEmit -p tsconfig.lib.json` (or `npx nx typecheck mcp-tools` from repo root)

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/mcp-tools/src/tools/entries/updateEntry.ts packages/mcp-tools/src/tools/entries/updateEntry.test.ts
git commit -m "feat: require version param to enforce read-before-write in update_entry [DX-759]

update_entry now requires the sys.version obtained from get_entry and
rejects the update when that version is stale, preventing silent
overwrites of concurrent edits.

BREAKING CHANGE: update_entry now requires a version parameter."
```

---

## Task 2: Update tool description and server instructions

**Files:**
- Modify: `packages/mcp-tools/src/tools/entries/register.ts:63-75`
- Modify: `packages/mcp-tools/src/tools/context/instructions.ts:51`

- [ ] **Step 1: Update the `update_entry` description in register.ts**

Replace the `description` string of the `updateEntry` entry (currently at `register.ts:65-66`) with:

```typescript
    updateEntry: {
      title: 'update_entry',
      description:
        'Update an existing entry. You MUST call get_entry first to read the ' +
        'current state, then pass the sys.version you received as the version ' +
        'parameter. The handler merges your field updates with the existing ' +
        'entry fields, so you only need to provide the fields you want to change. ' +
        'However, for multiple-locale fields, all existing locales must be ' +
        'included in the update. If the version is stale (the entry changed ' +
        'since you read it), the update is rejected and you must re-fetch with ' +
        'get_entry.',
      inputParams: UpdateEntryToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: updateEntry,
    },
```

- [ ] **Step 2: Strengthen the server instruction line in instructions.ts**

At `instructions.ts:51`, replace:

```
- Use update_entry for content modifications with AI assistance
```

with:

```
- Use update_entry for content modifications with AI assistance. Always call get_entry first and pass the returned sys.version to update_entry; this is required and prevents overwriting concurrent changes.
```

- [ ] **Step 3: Typecheck the package**

Run: `cd packages/mcp-tools && npx tsc --noEmit -p tsconfig.lib.json` (or `npx nx typecheck mcp-tools`)

Expected: no errors (these are string-only changes).

- [ ] **Step 4: Commit**

```bash
git add packages/mcp-tools/src/tools/entries/register.ts packages/mcp-tools/src/tools/context/instructions.ts
git commit -m "docs: instruct get_entry-before-update_entry in tool description and server instructions [DX-759]"
```

---

## Task 3: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full mcp-tools test suite**

Run: `npx nx test mcp-tools` (from repo root) or `npx nx run-many --target=test --projects=mcp-tools`

Expected: all tests pass. Pay attention to any *other* test file that constructs `update_entry` args (e.g. an integration or registration test) — if one exists and omits `version`, update it to pass `version`.

- [ ] **Step 2: Grep for any other callers of update_entry args that need `version`**

Run: `grep -rn "updateEntryTool\|UpdateEntryToolParams" packages --include='*.ts' | grep -v node_modules`

Expected: confirm the only references are `updateEntry.ts`, `updateEntry.test.ts`, and `register.ts`. If a registration/integration test exercises the tool with hardcoded args, add `version`.

- [ ] **Step 3: Lint**

Run: `npx nx lint mcp-tools` (from repo root)

Expected: no lint errors.

- [ ] **Step 4: Typecheck whole workspace**

Run: `npx nx run-many --target=typecheck` (from repo root)

Expected: no errors.

- [ ] **Step 5: Build**

Run: `npx nx build mcp-tools` (from repo root)

Expected: build succeeds.

---

## Self-Review Notes

- **Spec coverage:** Ticket asks to enforce read-before-write in `update_entry`. Task 1 adds the required `version` gate (enforcement + optimistic locking). Task 2 reinforces via description/instructions. Task 3 verifies. ✅
- **No placeholders:** All code shown inline; exact error string is duplicated identically in the test (Task 1 Step 1b) and the handler (Task 1 Step 3) — they must match character-for-character. ✅
- **Type consistency:** `version: z.number()` in schema → `args.version` is `number` → compared against `existingEntry.sys.version` (number). Error message wording is identical in test and handler. ✅
- **Breaking change handling:** Required param is breaking; commit uses `feat` + `BREAKING CHANGE:` footer for the commit-driven release tooling. ✅

## Deferred / Out of Scope

- **Deep locale merge** (preventing the shallow merge from dropping sibling locales like `fr` when the LLM sends only `en-US`) is a separate concern. The required-`version` gate forces the LLM to read all locales first, which mitigates it, but a true deep-merge is not implemented here. Note as a possible follow-up ticket if product wants belt-and-suspenders.
- **`update_asset`** has the same read-before-write shape; not in scope for DX-759 (entry only). Flag as a candidate for a sibling ticket.
