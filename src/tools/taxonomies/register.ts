import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getTaxonomyConceptTool,
  GetTaxonomyConceptToolParams,
} from './getConcept.js';
import { listConceptsTool, ListConceptsToolParams } from './listConcepts.js';

export function registerTaxonomyTools(server: McpServer) {
  server.tool(
    'get_concept',
    'Retrieve a specific taxonomy concept by its ID',
    GetTaxonomyConceptToolParams.shape,
    getTaxonomyConceptTool,
  );

  server.tool(
    'list_concepts',
    'List taxonomy concepts with configurable operations: getMany (default with cursor-based pagination using pageNext/pagePrev), getTotal (count), getDescendants (requires conceptId), or getAncestors (requires conceptId). Supports filtering by conceptScheme and full-text query. Only one operation type should be used at a time.',
    ListConceptsToolParams.shape,
    listConceptsTool,
  );
}
