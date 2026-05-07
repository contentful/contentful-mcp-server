# Zod for Tool Input Validation

## Status

Accepted

## Context

MCP tools need input schemas that serve two purposes: runtime validation of inputs from AI clients (which may hallucinate parameters), and schema advertisement to clients for type hints. The team needed a solution that could generate JSON Schema-compatible definitions while also providing runtime validation.

## Decision

All tool inputs are defined as Zod schemas. The `.shape` property is passed to the MCP SDK's `registerTool` for schema advertisement, and the same schema validates inputs at runtime.

## Consequences

- Single source of truth for input contracts — no drift between validation and documentation
- Zod's `.describe()` method provides field-level documentation visible to AI clients
- Strong TypeScript inference from schemas (no separate type definitions needed)
- Zod is a runtime dependency of `mcp-tools` (not just dev)
- Schema changes are breaking changes for AI client compatibility — must be treated carefully
