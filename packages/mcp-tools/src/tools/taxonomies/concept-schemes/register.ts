import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  createConceptSchemeTool,
  CreateConceptSchemeToolParams,
} from './createConceptScheme.js';
import {
  getConceptSchemeTool,
  GetConceptSchemeToolParams,
} from './getConceptScheme.js';
import {
  listConceptSchemesTool,
  ListConceptSchemesToolParams,
} from './listConceptSchemes.js';
import {
  updateConceptSchemeTool,
  UpdateConceptSchemeToolParams,
} from './updateConceptScheme.js';
import {
  deleteConceptSchemeTool,
  DeleteConceptSchemeToolParams,
} from './deleteConceptScheme.js';

export function registerCreateConceptSchemeTool(server: McpServer) {
  return server.registerTool(
    'create_concept_scheme',
    {
      description:
        'Create a new taxonomy concept scheme in Contentful. Concept schemes organize related concepts and provide hierarchical structure for taxonomy management. The prefLabel is required and should be localized. You can optionally provide a conceptSchemeId for a user-defined ID, or let Contentful generate one automatically. You can also include definitions, notes, and references to top-level concepts.',
      inputSchema: CreateConceptSchemeToolParams.shape,
    },
    createConceptSchemeTool,
  );
}

export function registerGetConceptSchemeTool(server: McpServer) {
  return server.registerTool(
    'get_concept_scheme',
    {
      description:
        'Retrieve a specific taxonomy concept scheme from Contentful. Returns the complete concept scheme with all its properties including prefLabel, definition, topConcepts, and other metadata.',
      inputSchema: GetConceptSchemeToolParams.shape,
    },
    getConceptSchemeTool,
  );
}

export function registerListConceptSchemesTool(server: McpServer) {
  return server.registerTool(
    'list_concept_schemes',
    {
      description:
        'List taxonomy concept schemes in a Contentful organization. Supports pagination and filtering options. Returns a summarized view of concept schemes with essential information.',
      inputSchema: ListConceptSchemesToolParams.shape,
    },
    listConceptSchemesTool,
  );
}

export function registerUpdateConceptSchemeTool(server: McpServer) {
  return server.registerTool(
    'update_concept_scheme',
    {
      description:
        'Update a taxonomy concept scheme in Contentful. Requires the concept scheme ID and version number for optimistic concurrency control. You can update any combination of fields - only the fields you provide will be changed, while others remain unchanged. Use this to modify labels, definitions, relationships, and other concept scheme properties.',
      inputSchema: UpdateConceptSchemeToolParams.shape,
    },
    updateConceptSchemeTool,
  );
}

export function registerDeleteConceptSchemeTool(server: McpServer) {
  return server.registerTool(
    'delete_concept_scheme',
    {
      description:
        'Delete a taxonomy concept scheme from Contentful. Requires the concept scheme ID and version number for optimistic concurrency control. This operation permanently removes the concept scheme and cannot be undone.',
      inputSchema: DeleteConceptSchemeToolParams.shape,
    },
    deleteConceptSchemeTool,
  );
}
