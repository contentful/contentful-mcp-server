# Contributing to Contentful MCP Server

Thank you for your interest in contributing to the Contentful MCP Server! We welcome contributions from the community and are grateful for your help in making this project better.

## 🤝 How to Contribute

There are many ways to contribute to this project:

- **Report bugs** - Help us identify and fix issues by submitting a [bug report](https://github.com/contentful/contentful-mcp-server/issues/new?template=bug_report.md). Please only submit bugs for issues potentially impacting all users of this project. If you have an issue that might be specific to you, contains sensitive information, or aren't sure where to go, please [visit our support and help center](https://support.contentful.com/hc/en-us) first.
- **Suggest features** - Share ideas for new functionality by opening a [feature request](https://github.com/contentful/contentful-mcp-server/issues/new?template=bug_report.md)
- **Submit a pull request** - For docs updates or small improvements, open a [pull request](https://github.com/contentful/contentful-mcp-server/pulls). For larger contributions, please open a [feature request](https://github.com/contentful/contentful-mcp-server/issues/new?template=bug_report.md) first so that we can discuss your idea and contribution with you.

## 📋 Before You Start

Before contributing, please:

1. Read through the [README](./README.md) to understand the project
2. Browse existing [issues](https://github.com/contentful/contentful-mcp-server/issues) and [pull requests](https://github.com/contentful/contentful-mcp-server/pulls) to check if your idea or bug report already exists
3. Review our [Code of Conduct](./README.md#️-code-of-conduct)

## 🛠️ Development Setup

### Prerequisites

- Node.js
- npm
- A Contentful account with a [Space ID](https://www.contentful.com/help/spaces/find-space-id/)
- [Contentful Management API personal access token](https://www.contentful.com/help/token-management/personal-access-tokens/)

### Setup Steps

1. **Fork the repository**

   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/yourusername/contentful-mcp-server.git
   cd contentful-mcp-server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the project**

   ```bash
   npm run build
   ```

4. **Configure the MCP server in your IDE**
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

### Testing with MCP Inspector

For local development and testing:

1. **Set up environment variables** - Create a `.env` file in the project root:

   ```bash
   # Copy the example environment file
   cp .env.example .env
   # Edit .env with your Contentful credentials
   ```

2. **Run the inspector** - The MCP Inspector runs in your browser for interactive testing and automatically loads environment variables from your `.env` file.

   To run the inspector with logs:

   In one terminal:

   ```bash
   npm run logs:watch
   ```

   In another terminal:

   ```bash
   npm run inspect:watch
   ```

   Alternatively, run the inspector without seeing logs:

   ```bash
   npm run inspect
   ```

### Linting

```bash
npm run lint
npm run lint:fix
```

## 🏗️ Project Structure

```
src/
├── config/          # Configuration files
├── tools/           # MCP tools implementation
│   ├── assets/      # Asset management tools
│   ├── entries/     # Entry management tools
│   ├── types/       # Content type tools
│   └── ...
├── utils/           # Utility functions
└── types/           # TypeScript type definitions
```

## 🔄 Pull Request Process

### Before Submitting

1. **Create a branch** for your changes

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make your changes** following the coding standards

3. **Test your changes**

   ```bash
   npm run lint
   npm run build
   ```

4. **Commit your changes** using [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)

   ```bash
   git add .
   git commit -m "feat: add new content type validation"
   ```

5. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Submit a pull request targeting the main branch**

### Review Process

1. **Automated checks** will run on your PR
2. **Maintainers** will review your code
3. **Address feedback** by making additional commits
4. **Squash and merge** once approved
