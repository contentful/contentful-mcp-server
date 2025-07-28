#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAllPrompts } from './prompts/register.js';
import { registerAllResources } from './resources/register.js';
import { registerAllTools } from './tools/register.js';
import { VERSION } from './config/version.js';

if (process.env.NODE_ENV === 'development') {
  import('mcps-logger/console');
}

const MCP_SERVER_NAME = '@contentful/mcp-server';

async function initializeServer() {
  const server = new McpServer({
    name: MCP_SERVER_NAME,
    version: VERSION,
  });

  registerAllTools(server);
  registerAllPrompts(server);
  registerAllResources(server);

  return server;
}

async function main() {
  try {
    const server = await initializeServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
