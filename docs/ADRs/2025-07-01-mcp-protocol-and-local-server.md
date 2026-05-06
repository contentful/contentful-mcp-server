# Use MCP as the AI Integration Protocol

## Status

Accepted

## Context

Contentful needed a standardized way for AI assistants to interact with the Content Management API. The LLM ecosystem was coalescing around multiple approaches: custom plugins (ChatGPT), function calling (OpenAI/Anthropic), and the emerging Model Context Protocol (MCP). Customer demand and competitive pressure from other CMS vendors required a decision on which protocol to adopt.

Alternatives considered:
- Custom REST API wrapper with OpenAPI spec for each LLM provider
- OpenAI plugin format
- MCP (Model Context Protocol) — open standard by Anthropic, adopted by Claude and OpenAI (March 2025)

## Decision

Adopted MCP as the protocol standard and built a local, open-source, Node.js-based MCP server distributed via npm. The server exposes CMA capabilities as MCP tools with Zod-validated input schemas.

Key factors:
- MCP was becoming the de facto standard — early adoption by Claude and OpenAI signaled broad ecosystem convergence
- Open standard with clear spec — no vendor lock-in
- Stdio transport is simple to integrate into any AI client (Cursor, VS Code, Claude Desktop)
- Tool registration model maps cleanly to CMA operations

Source: RFC "Contentful MCP Server" (approved, DX-168)

## Consequences

- Contentful positioned as early MCP adopter in the CMS space
- Single tool definition set can be shared across local and remote server variants
- Dependency on `@modelcontextprotocol/sdk` — must track breaking changes in the evolving spec
- Stdio transport limits the local server to one client at a time per process
