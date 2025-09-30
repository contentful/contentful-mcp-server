# @contentful/mcp-tools

A toolkit package containing reusable MCP (Model Context Protocol) tool registration functions for Contentful. This package extracts and exports all the MCP tool registration logic from the Contentful MCP server, making it reusable across both local and remote MCP server implementations.

## Installation

```bash
npm install @contentful/mcp-tools
```

## Usage

### Registering All Tools

```typescript
import {
  registerGetInitialContextTool,
  registerSearchEntriesTool,
  registerCreateEntryTool,
} from '@contentful/mcp-tools';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const server = new McpServer();

registerGetInitialContextTool(server);
registerSearchEntriesTool(server);
registerCreateEntryTool(server);
```

### Registering Specific Tool Categories

```typescript
import {
  registerUploadAssetTool,
  registerListAssetsTool,
} from '@contentful/mcp-tools';
import { registerCreateEntryTool } from '@contentful/mcp-tools';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const server = new McpServer();

registerUploadAssetTool(server);
registerListAssetsTool(server);
registerCreateEntryTool(server);
```

## 🛠️ Available Tools

| Category                  | Tool Name                  | Description                                      |
| ------------------------- | -------------------------- | ------------------------------------------------ |
| **Context & Setup**       | `get_initial_context`      | Initialize connection and get usage instructions |
| **Content Types**         | `list_content_types`       | List all content types                           |
|                           | `get_content_type`         | Get detailed content type information            |
|                           | `create_content_type`      | Create new content types                         |
|                           | `update_content_type`      | Modify existing content types                    |
|                           | `publish_content_type`     | Publish content type changes                     |
|                           | `unpublish_content_type`   | Unpublish content types                          |
|                           | `delete_content_type`      | Remove content types                             |
| **Entries**               | `search_entries`           | Search and filter entries                        |
|                           | `get_entry`                | Retrieve specific entries                        |
|                           | `create_entry`             | Create new content entries                       |
|                           | `update_entry`             | Modify existing entries                          |
|                           | `publish_entry`            | Publish entries (single or bulk)                 |
|                           | `unpublish_entry`          | Unpublish entries (single or bulk)               |
|                           | `delete_entry`             | Remove entries                                   |
| **Assets**                | `upload_asset`             | Upload new assets                                |
|                           | `list_assets`              | List and browse assets                           |
|                           | `get_asset`                | Retrieve specific assets                         |
|                           | `update_asset`             | Modify asset metadata                            |
|                           | `publish_asset`            | Publish assets (single or bulk)                  |
|                           | `unpublish_asset`          | Unpublish assets (single or bulk)                |
|                           | `delete_asset`             | Remove assets                                    |
| **Spaces & Environments** | `list_spaces`              | List available spaces                            |
|                           | `get_space`                | Get space details                                |
|                           | `list_environments`        | List environments                                |
|                           | `create_environment`       | Create new environments                          |
|                           | `delete_environment`       | Remove environments                              |
| **Locales**               | `list_locales`             | List all locales in your environment             |
|                           | `get_locale`               | Retrieve specific locale information             |
|                           | `create_locale`            | Create new locales for multi-language content    |
|                           | `update_locale`            | Modify existing locale settings                  |
|                           | `delete_locale`            | Remove locales from environment                  |
| **Tags**                  | `list_tags`                | List all tags                                    |
|                           | `create_tag`               | Create new tags                                  |
| **AI Actions**            | `create_ai_action`         | Create custom AI-powered workflows               |
|                           | `invoke_ai_action`         | Invoke an AI action with variables               |
|                           | `get_ai_action_invocation` | Get AI action invocation details                 |
|                           | `get_ai_action`            | Retrieve AI action details and configuration     |
|                           | `list_ai_actions`          | List AI actions in a space                       |
|                           | `update_ai_action`         | Update existing AI actions                       |
|                           | `publish_ai_action`        | Publish AI actions for use                       |
|                           | `unpublish_ai_action`      | Unpublish AI actions                             |
|                           | `delete_ai_action`         | Remove AI actions                                |

## Configuration

The tools require environment variables to be configured:

```bash
CONTENTFUL_MANAGEMENT_ACCESS_TOKEN=your_token_here
CONTENTFUL_HOST=api.contentful.com
SPACE_ID=your_space_id
ENVIRONMENT_ID=master
```

## Testing

All tools include comprehensive unit tests. Run tests with:

```bash
npm test
```

## License

MIT
