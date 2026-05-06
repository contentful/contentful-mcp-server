# CMA v12 Migration — Namespace Imports

## Status

Accepted

## Context

`contentful-management` v12 dropped the default export in favor of named exports. The existing codebase used `import { createClient } from 'contentful-management'` which still worked, but mock patterns and type references needed updating. The v12 upgrade also brought TypeScript improvements and API surface changes.

## Decision

Updated to `contentful-management` ^12.2.0. Changed all files to use namespace imports (`import * as ctfl from 'contentful-management'`) where needed for type access. Kept `createClient` as a named import in utility code since it's still exported by name.

Source: commits on branch `dx-783-cma-v12-contentful-mcp-server` (merged via PR #357)

## Consequences

- Mock patterns in tests updated to match v12 API shape
- No `{ type: 'plain' }` or `{ type: 'legacy' }` client option needed — v12 defaults work for this codebase
- Future CMA upgrades should be simpler since we're on the modern API surface
- Some method names changed (test mocks updated accordingly)
