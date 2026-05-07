# Monorepo Structure with Shared mcp-tools Package

## Status

Accepted

## Context

The initial implementation was a single-package repo (`@contentful/mcp-server`). When the Remote MCP Server initiative began (a cloud-hosted, OAuth-secured variant), the team faced a choice: duplicate tool logic across repos, or extract shared tools into a reusable package.

Alternatives considered:
- Keep tools in `mcp-server` and import directly into the remote server (creates circular/awkward dependency)
- Separate standalone `mcp-toolkit` repo (adds coordination overhead for changes)
- Monorepo with shared package (keeps tools and server in one repo, single PR for changes)

## Decision

Restructured `contentful-mcp-server` into an Nx-managed monorepo with two packages:
- `packages/mcp-server` — thin shell that wires stdio transport to tools (published to npm)
- `packages/mcp-tools` — all tool implementations, schemas, and utilities (published to GitHub Packages for internal consumption by the remote MCP server)

The `ContentfulMcpTools` class provides a programmatic API for consumers to get tool collections by category.

Source: RFC "Remote MCP" (DX-425, commit `faf9e23` — "chore: migrate to monorepo")

## Consequences

- Tool logic is defined once, consumed by both local and remote servers
- Nx provides build caching and task orchestration across packages
- Release management uses Nx Release with independent versioning per package
- `mcp-tools` is published to GitHub Packages (not public npm) since it's consumed by the internal remote MCP server
- Contributors must understand Nx workspace conventions (but standard npm scripts delegate to Nx transparently)
