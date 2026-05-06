# DXT Packaging for Claude Desktop

## Status

Accepted

## Context

Claude Desktop introduced the DXT (Desktop Extension) format for one-click MCP server installation. Previously, users had to manually configure `mcpServers` JSON. The team wanted to reduce friction for non-technical users.

## Decision

Added `@anthropic-ai/dxt` as a dev dependency and a CI step that runs `npx dxt pack packages/mcp-server contentful-mcp-server.dxt` during the build workflow. The resulting `.dxt` file is uploaded as a GitHub Release asset alongside each version.

Source: commit `1ab2d10` — "fix: .dxt extension included as release asset [DX-318]"

## Consequences

- Claude Desktop users can install by downloading a single file from GitHub Releases
- DXT pack runs during CI build step — must account for monorepo structure (`packages/mcp-server` as the pack target)
- The DXT manifest lives within `packages/mcp-server` alongside the package.json
- Non-Claude clients still use the `npx @contentful/mcp-server` installation method
