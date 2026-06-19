#!/usr/bin/env node
import { handleCliInfoFlags } from './cli.js';
import { getVersion } from './getVersion.js';

if (process.env.NODE_ENV === 'development') {
  try {
    await import('mcps-logger/console');
  } catch {
    console.warn(
      'mcps-logger not available outside the development environment.',
    );
  }
}

const MCP_SERVER_NAME = '@contentful/mcp-server';

async function initializeServer() {
  const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
  const { registerAllTools } = await import('./tools/register.js');
  const { registerAllPrompts } = await import('./prompts/register.js');
  const { registerAllResources } = await import('./resources/register.js');

  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: getVersion(),
  });

  registerAllTools(server);
  registerAllPrompts(server);
  registerAllResources(server);

  return server;
}

async function main() {
  try {
    const server = await initializeServer();
    const { StdioServerTransport } = await import(
      '@modelcontextprotocol/sdk/server/stdio.js'
    );
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

if (!handleCliInfoFlags()) {
  main();
}
