import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  createConceptSchemeTool,
  CreateConceptSchemeToolParams,
} from './createConceptScheme.js';
import {
  deleteConceptSchemeTool,
  DeleteConceptSchemeToolParams,
} from './deleteConceptScheme.js';

export function registerConceptSchemesTools(server: McpServer) {
  server.tool(
    'create_concept_scheme',
    'Create a new taxonomy concept scheme in Contentful. Concept schemes organize related concepts and provide hierarchical structure for taxonomy management. The prefLabel is required and should be localized. You can optionally provide a conceptSchemeId for a user-defined ID, or let Contentful generate one automatically. You can also include definitions, notes, and references to top-level concepts.',
    CreateConceptSchemeToolParams.shape,
    createConceptSchemeTool,
  );

  server.tool(
    'delete_concept_scheme',
    'Delete a taxonomy concept scheme from Contentful. Requires the concept scheme ID and version number for optimistic concurrency control. This operation permanently removes the concept scheme and cannot be undone.',
    DeleteConceptSchemeToolParams.shape,
    deleteConceptSchemeTool,
  );
}
