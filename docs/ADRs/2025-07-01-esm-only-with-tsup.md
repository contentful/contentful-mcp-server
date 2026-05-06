# ESM-Only Output with tsup Bundler

## Status

Accepted

## Context

The project needed to choose between CommonJS, ESM, or dual module output. The MCP SDK itself uses ESM, and the Node.js ecosystem is trending toward ESM-first. The build tool choice also needed to produce clean, fast builds for both packages.

## Decision

Both packages are ESM-only (`"type": "module"` in package.json) and use tsup as the bundler. TypeScript source uses `.js` extensions in import paths (required for ESM + TypeScript).

Key factors:
- `@modelcontextprotocol/sdk` is ESM-only — CJS would require complex interop
- Node.js 22 (the minimum version) has mature ESM support
- tsup provides fast, zero-config bundling with tree-shaking
- Single format simplifies the build and avoids dual-package hazard

## Consequences

- All internal imports must use `.js` extensions (e.g., `import { foo } from './bar.js'`)
- Consumers must use ESM-compatible environments (Node.js 22+)
- No CJS fallback — this is acceptable since MCP clients invoke via `npx` (gets latest Node.js)
- Dynamic imports (`await import(...)`) work naturally for lazy-loading heavy dependencies
