import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerConceptsTools } from './concepts/register.js';

export function registerTaxonomyTools(server: McpServer) {
  registerConceptsTools(server);
}
