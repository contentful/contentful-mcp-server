import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerConceptSchemesTools } from './concept-schemes/register.js';
import { registerConceptsTools } from './concepts/register.js';

export function registerTaxonomyTools(server: McpServer) {
  registerConceptSchemesTools(server);
  registerConceptsTools(server);
}
