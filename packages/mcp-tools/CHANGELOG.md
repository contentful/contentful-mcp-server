## 0.10.0 (2026-06-08)

### 🚀 Features

- add semantic_search MCP tool [DX-1211] ([#386](https://github.com/contentful/contentful-mcp-server/pull/386))

## 0.9.0 (2026-06-08)

### 🚀 Features

- add resolve_entry_references MCP tool [DX-754] ([#384](https://github.com/contentful/contentful-mcp-server/pull/384))

## 0.8.0 (2026-06-05)

### 🚀 Features

- add MAX_BULK_SIZE limit and dryRun to bulk MCP tools [DX-1063] ([#382](https://github.com/contentful/contentful-mcp-server/pull/382))

## 0.7.0 (2026-06-02)

### 🚀 Features

- two-phase confirmation on destructive MCP tools [DX-1057] ([#380](https://github.com/contentful/contentful-mcp-server/pull/380))

## 0.6.0 (2026-06-02)

### 🚀 Features

- add PROTECTED_ENVIRONMENTS to block writes on listed envs [DX-1058] ([#381](https://github.com/contentful/contentful-mcp-server/pull/381))

## 0.5.0 (2026-06-02)

### 🚀 Features

- add omit/disable/delete field tools for content types [DX-732] ([#377](https://github.com/contentful/contentful-mcp-server/pull/377))

### 🩹 Fixes

- require array-only entryId to prevent LLM character truncation [DX-736] ([#378](https://github.com/contentful/contentful-mcp-server/pull/378))

## 0.4.5 (2026-06-01)

### 🩹 Fixes

- remove host/proxy/headers from export_space and import_space tool schemas [DX-1177] ([#376](https://github.com/contentful/contentful-mcp-server/pull/376))

## 0.4.4 (2026-05-28)

### 🩹 Fixes

- normalize array filters in search_entries to fix CMA 400 [DX-1171] ([#375](https://github.com/contentful/contentful-mcp-server/pull/375))

## 0.4.3 (2026-05-28)

### 🩹 Fixes

- pass sourceEnvironmentId in params to CMA SDK [DX-984] ([#373](https://github.com/contentful/contentful-mcp-server/pull/373))

## 0.4.2 (2026-05-22)

### 🩹 Fixes

- mark publish/unpublish/archive tools as destructive [DX-1059] ([#371](https://github.com/contentful/contentful-mcp-server/pull/371))

## 0.4.1 (2026-04-14)

### 🩹 Fixes

- lazy import used for contentful-export ([#359](https://github.com/contentful/contentful-mcp-server/pull/359))

## 0.4.0 (2026-04-13)

### 🚀 Features

- support local file uploads via base64 data URIs in upload_asset [DX-924] ([#356](https://github.com/contentful/contentful-mcp-server/pull/356))

## 0.3.2 (2026-04-13)

### 🩹 Fixes

- bump contentful-management to v12 [DX-783] ([#357](https://github.com/contentful/contentful-mcp-server/pull/357))

## 0.3.1 (2026-03-31)

### 🩹 Fixes

- **typescript:** add typechecking commands and fix a few ts bugs ([#350](https://github.com/contentful/contentful-mcp-server/pull/350))

## 0.3.0 (2026-03-24)

### 🚀 Features

- **tools:** add zod schemas/types for rich text fields ([#347](https://github.com/contentful/contentful-mcp-server/pull/347))

## 0.2.6 (2026-03-18)

### 🩹 Fixes

- zod entryFieldsSchema supports all valid json ([#338](https://github.com/contentful/contentful-mcp-server/pull/338))

## 0.2.5 (2026-03-02)

### 🩹 Fixes

- default values removed to enforce schema shape ([#330](https://github.com/contentful/contentful-mcp-server/pull/330))

## 0.2.4 (2026-02-25)

### 🩹 Fixes

- entry fields schema [DX-749] ([#326](https://github.com/contentful/contentful-mcp-server/pull/326))

## 0.2.3 (2026-01-09)

This was a version bump only for mcp-tools to align it with other projects, there were no code changes.

## 0.2.2 (2025-12-11)

### 🩹 Fixes

- update how mcp version is derived [DX-597] ([#296](https://github.com/contentful/contentful-mcp-server/pull/296))

## 0.2.1 (2025-12-09)

### 🩹 Fixes

- query param changed to match param to support full text search [DX-596] ([#294](https://github.com/contentful/contentful-mcp-server/pull/294))

## 0.2.0 (2025-12-02)

### 🚀 Features

- **search:** enhanced search entries [] ([#289](https://github.com/contentful/contentful-mcp-server/pull/289), [#263](https://github.com/contentful/contentful-mcp-server/issues/263), [#266](https://github.com/contentful/contentful-mcp-server/issues/266))

### 🩹 Fixes

- use dynamic imports for import and export tools [DX-580] ([#264](https://github.com/contentful/contentful-mcp-server/pull/264), [#286](https://github.com/contentful/contentful-mcp-server/issues/286))

## 0.1.2 (2025-11-21)

### 🩹 Fixes

- refactor MCP tools to use class-based initialization [DX-579] ([#263](https://github.com/contentful/contentful-mcp-server/pull/263))

## 0.1.1 (2025-11-20)

### 🩹 Fixes

- emit ts declarations for mcp tools [DX-578] ([#261](https://github.com/contentful/contentful-mcp-server/pull/261))

## 0.1.0 (2025-11-19)

### 🚀 Features

- editor interface tools [DX-481] ([#237](https://github.com/contentful/contentful-mcp-server/pull/237))
- entry archive & unarchive tooling [DX-486] ([#228](https://github.com/contentful/contentful-mcp-server/pull/228))
- asset archive & unarchive tools [DX-303] ([#227](https://github.com/contentful/contentful-mcp-server/pull/227))
- taxonomy concept CRUD tools [DX-408] ([#212](https://github.com/contentful/contentful-mcp-server/pull/212))
- refactor local server to use mcp-tools package [DX-414] ([#203](https://github.com/contentful/contentful-mcp-server/pull/203))
- tools migrated to mcp-tools package [DX-413] ([#196](https://github.com/contentful/contentful-mcp-server/pull/196))
