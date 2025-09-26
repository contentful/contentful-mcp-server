import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerConceptSchemesTools } from './concept-schemes/register.js';

export function registerTaxonomyTools(server: McpServer) {
  registerConceptSchemesTools(server);
}
