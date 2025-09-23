import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createConceptTool, CreateConceptToolParams } from './createConcept.js';
import { deleteConceptTool, DeleteConceptToolParams } from './deleteConcept.js';
import { updateConceptTool, UpdateConceptToolParams } from './updateConcept.js';
import { getConceptTool, GetConceptToolParams } from './getConcept.js';
import { listConceptsTool, ListConceptsToolParams } from './listConcepts.js';

export function registerConceptsTools(server: McpServer) {
  server.tool(
    'create_concept',
    'Create a new taxonomy concept in Contentful. Concepts are used to organize and categorize content within taxonomies. The prefLabel is required and should be localized. You can optionally provide a conceptId for a user-defined ID, or let Contentful generate one automatically. You can also include definitions, notes, relationships to other concepts, and various metadata fields.',
    CreateConceptToolParams.shape,
    createConceptTool,
  );

  server.tool(
    'delete_concept',
    'Delete a taxonomy concept from Contentful. Requires the concept ID and version number for optimistic concurrency control. This operation permanently removes the concept and cannot be undone.',
    DeleteConceptToolParams.shape,
    deleteConceptTool,
  );

  server.tool(
    'update_concept',
    'Update a taxonomy concept in Contentful. Requires the concept ID and version number for optimistic concurrency control. You can update any combination of fields - only the fields you provide will be changed, while others remain unchanged. Use this to modify labels, definitions, relationships, and other concept properties.',
    UpdateConceptToolParams.shape,
    updateConceptTool,
  );

  server.tool(
    'get_concept',
    'Retrieve a specific taxonomy concept from Contentful. Returns the complete concept with all its properties including prefLabel, definition, relationships, and other metadata.',
    GetConceptToolParams.shape,
    getConceptTool,
  );

  server.tool(
    'list_concepts',
    'List taxonomy concepts in a Contentful organization. Supports multiple modes: (1) Default - list all concepts with pagination and filtering, (2) getTotalOnly - return only the total count of concepts, (3) getDescendants - get descendants of a specific concept (requires conceptId), (4) getAncestors - get ancestors of a specific concept (requires conceptId). Returns summarized view of concepts with essential information.',
    ListConceptsToolParams.shape,
    listConceptsTool,
  );
}
