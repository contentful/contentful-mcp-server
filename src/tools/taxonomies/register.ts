import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerConceptsTools } from './concepts/register.js';
import { registerConceptSchemesTools } from './concept-schemes/register.js';

export function registerTaxonomyTools(server: McpServer) {
  registerConceptsTools(server);
  registerConceptSchemesTools(server);
}
