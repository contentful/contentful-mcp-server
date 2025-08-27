## 1.2.0 (2025-08-25)

### 🚀 Features

- add custom content type ID support for content type creation ([#122](https://github.com/contentful/contentful-mcp-server/pull/122), [#115](https://github.com/contentful/contentful-mcp-server/issues/115))

## 1.1.0 (2025-08-21)

### 🚀 Features

- add support for default values in content type fields [DX-345] ([#113](https://github.com/contentful/contentful-mcp-server/issues/113))

## 1.0.5 (2025-08-13)

### 🩹 Fixes

- .dxt extension included as release asset [DX-318] ([#92](https://github.com/contentful/contentful-mcp-server/pull/92))

## 1.0.4 (2025-08-06)

### 🩹 Fixes

- include the build folder in the released package [DX-315] ([#90](https://github.com/contentful/contentful-mcp-server/pull/90))

## 1.0.3 (2025-08-05)

### 🩹 Fixes

- build path updated in release job [DX-315] ([#86](https://github.com/contentful/contentful-mcp-server/pull/86))

## 1.0.2 (2025-07-30)

### 🩹 Fixes

- [PDHD-6691] fix missing user info ([#75](https://github.com/contentful/contentful-mcp-server/pull/75))

## 1.0.1 (2025-07-30)

### 🩹 Fixes

- node_env check to import mcps_logger now opt in [DX-300] ([#65](https://github.com/contentful/contentful-mcp-server/pull/65))
- update github token for release script [DX-302] ([#67](https://github.com/contentful/contentful-mcp-server/pull/67))
- add github user config to release step [DX-302] ([#69](https://github.com/contentful/contentful-mcp-server/pull/69))
- [PDHD-6691] fix release workflow ([#74](https://github.com/contentful/contentful-mcp-server/pull/74))

# 1.0.0 (2025-07-25)

### 🚀 Features

- create_entry functionality implemented [DX-140] ([#2](https://github.com/contentful/contentful-mcp-server/pull/2))
- CRUD functionality implemented for content entries [DX-153] ([#3](https://github.com/contentful/contentful-mcp-server/pull/3))
- implement CRUD functionality for content types using 5 new tools [DX-167] ([#7](https://github.com/contentful/contentful-mcp-server/pull/7))
- asset, environment, space tools implemented with new publish logic [DX-169] ([#10](https://github.com/contentful/contentful-mcp-server/pull/10))
- refactor list/search tools and publish/unpublish tools to improve model efficiency [DX-169] ([#11](https://github.com/contentful/contentful-mcp-server/pull/11))
- add support for tags in Entry and Asset tools [DX-183] ([#2](https://github.com/contentful/contentful-mcp-server/pull/2))
- implement first ai_actions tool and set up register files [DX-243] ([#5](https://github.com/contentful/contentful-mcp-server/pull/5))
- automate license attribution [DX-244] ([#4](https://github.com/contentful/contentful-mcp-server/pull/4))
- Add tooling for AI actions minus invocation actions ([#6](https://github.com/contentful/contentful-mcp-server/pull/6))
- AiAction invocation tools implemented [DX-245] ([#8](https://github.com/contentful/contentful-mcp-server/pull/8))
- Add tooling for locale actions [DX-264] ([#32](https://github.com/contentful/contentful-mcp-server/pull/32))
- ⚠️ **nx:** first semantic releases with NX, v1.0.0 ([#26](https://github.com/contentful/contentful-mcp-server/pull/26))

### 🩹 Fixes

- build gha ([2a2a00b](https://github.com/contentful/contentful-mcp-server/commit/2a2a00b))
- bulk publish and unpublish actions are no longer bugged [DX-213] ([#15](https://github.com/contentful/contentful-mcp-server/pull/15))
- prettier format [DX-214] ([#16](https://github.com/contentful/contentful-mcp-server/pull/16))
- prevent deleting locale data when using update_entry [DX-265] ([#41](https://github.com/contentful/contentful-mcp-server/pull/41))
- MEC-1981 fix release action ([#51](https://github.com/contentful/contentful-mcp-server/pull/51))
- **ci:** rename vault-secrets.yml to vault-secrets.yaml. :facepalm: ([#8](https://github.com/contentful/contentful-mcp-server/pull/8))

### ⚠️ Breaking Changes

- **nx:** pin node version at >=22.0.0"
