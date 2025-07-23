# Contentful MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that provides AI assistants with comprehensive tools to interact with [Contentful](https://www.contentful.com/) APIs.

## 🚀 Example Use Cases

This MCP server provides a comprehensive set of tools for content management, allowing AI to help you create, edit, organize, and publish content directly within Contentful. Once configured, you can use natural language in your AI assistant of choice to manage and interact with your Contentful spaces, including:

- **Content Creation**: "Create a new blog post for our fall product launch"
- **Content Management**: "Update all product entries to include the new pricing structure"
- **Asset Organization**: "Upload and organize these marketing images by campaign"
- **Workflow Automation**: "Create an AI action that translates content to Spanish"
- **Content Modeling**: "Add a new field to the product content type for customer ratings"

## 📓 Table of Contents

- [⚙️ Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Configuration](#configuration)
- [🛠️ Available Tools](#️-available-tools)
- [🔍 Development](#-development)
  - [Testing with MCP Inspector](#testing-with-mcp-inspector)
  - [Linting](#linting)
- [📦 Releases](#-releases)
- [🤝 Contributing](#-contributing)
  - [Development Setup](#development-setup)
- [📚 Documentation](#-documentation)
- [❓ Help & Support](#-help--support)
- [📄 License and Notices](#-license-and-notices)
- [🛡️ Code of Conduct](#️-code-of-conduct)

## ⚙️ Getting Started

### Prerequisites

- Node.js
- npm
- A Contentful account with a [Space ID](https://www.contentful.com/help/spaces/find-space-id/)
- [Contentful Management API personal access token](https://www.contentful.com/help/token-management/personal-access-tokens/)

### Installation

#### Install from source

```bash
git clone https://github.com/contentful/contentful-mcp-server.git
cd contentful-mcp-server
npm install
npm run build
```

### Environment Variables

| Environment Variable                 | Required | Default Value        | Description                                          |
| ------------------------------------ | -------- | -------------------- | ---------------------------------------------------- |
| `CONTENTFUL_MANAGEMENT_ACCESS_TOKEN` | ✅ Yes   | -                    | Your Contentful Management API personal access token |
| `SPACE_ID`                           | ✅ Yes   | -                    | Your Contentful Space ID                             |
| `ENVIRONMENT_ID`                     | ❌ No    | `master`             | Target environment within your space                 |
| `CONTENTFUL_HOST`                    | ❌ No    | `api.contentful.com` | Contentful API host                                  |

### Configuration

Refer to the documentation for your AI tool of choice for how to configure MCP servers. For example, see the documentation for [Cursor](https://docs.cursor.com/context/mcp), [VS Code](https://code.visualstudio.com/docs/copilot/chat/mcp-servers), or [Claude Desktop](https://modelcontextprotocol.io/quickstart/user).

Below is a sample configuration for Cursor:

```json
{
  "mcpServers": {
    "contentful-mcp": {
      "command": "npx",
      "args": ["-y", "<your_full_path_to_the_package>/index.js"],
      "env": {
        "CONTENTFUL_MANAGEMENT_ACCESS_TOKEN": "your-CMA-token",
        "SPACE_ID": "your-space-id",
        "ENVIRONMENT_ID": "master",
        "CONTENTFUL_HOST": "api.contentful.com"
      }
    }
  }
}
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

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for local development setup and contribution guidelines.

## 📦 Releases

This project uses [Nx Release](https://nx.dev/features/manage-releases) for automated versioning and publishing. Releases are automatically generated based on [Conventional Commits](https://www.conventionalcommits.org/). See [Contributing Guide](CONTRIBUTING.md) for more information on release process.

## 📚 Documentation

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Contentful Management API Documentation](https://www.contentful.com/developers/docs/references/content-management-api/)

## ❓ Help & Support

- [Contentful support resources](https://www.contentful.com/help/getting-started/how-to-get-help/)
- [Report bugs or request features](https://github.com/contentful/contentful-mcp-server/issues)
- [Contentful Community Discord](https://www.contentful.com/discord/)

## 📄 License and Notices

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

It also includes open-source components licensed under MIT, BSD-2-Clause, and Apache-2.0. For details, see the [NOTICE](./NOTICE) file.

This project includes an automated license management system that keeps track of all dependencies and their licenses. See the [AUTOMATION-FOR-LICENSES](./AUTOMATION-FOR-LICENSES.md) file for more information.

## 🛡️ Code of Conduct

We want to provide a safe, inclusive, welcoming, and harassment-free space and experience for all participants, regardless of gender identity and expression, sexual orientation, disability, physical appearance, socioeconomic status, body size, ethnicity, nationality, level of experience, age, religion (or lack thereof), or other identity markers.

[Read our full Code of Conduct](https://www.contentful.com/developers/code-of-conduct/).
