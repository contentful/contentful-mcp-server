import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  createConceptSchemeTool,
  CreateConceptSchemeToolParams,
} from './createConceptScheme.js';
import {
  updateConceptSchemeTool,
  UpdateConceptSchemeToolParams,
} from './updateConceptScheme.js';
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
    'update_concept_scheme',
    'Update a taxonomy concept scheme in Contentful. Requires the concept scheme ID and version number for optimistic concurrency control. You can update any combination of fields - only the fields you provide will be changed, while others remain unchanged. Use this to modify labels, definitions, relationships, and other concept scheme properties.',
    UpdateConceptSchemeToolParams.shape,
    updateConceptSchemeTool,
  );

  server.tool(
    'delete_concept_scheme',
    'Delete a taxonomy concept scheme from Contentful. Requires the concept scheme ID and version number for optimistic concurrency control. This operation permanently removes the concept scheme and cannot be undone.',
    DeleteConceptSchemeToolParams.shape,
    deleteConceptSchemeTool,
  );
}
