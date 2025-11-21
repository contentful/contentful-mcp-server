import { createConceptTool, CreateConceptToolParams } from './createConcept.js';
import { deleteConceptTool, DeleteConceptToolParams } from './deleteConcept.js';
import { updateConceptTool, UpdateConceptToolParams } from './updateConcept.js';
import { getConceptTool, GetConceptToolParams } from './getConcept.js';
import { listConceptsTool, ListConceptsToolParams } from './listConcepts.js';
import type { ContentfulConfig } from '../../../config/types.js';

export function createConceptTools(config: ContentfulConfig) {
  const createConcept = createConceptTool(config);
  const deleteConcept = deleteConceptTool(config);
  const updateConcept = updateConceptTool(config);
  const getConcept = getConceptTool(config);
  const listConcepts = listConceptsTool(config);

  return {
    createConcept: {
      title: 'create_concept',
      description:
        'Create a new taxonomy concept in Contentful. Concepts are used to organize and categorize content within taxonomies. The prefLabel is required and should be localized. You can optionally provide a conceptId for a user-defined ID, or let Contentful generate one automatically. You can also include definitions, notes, relationships to other concepts, and various metadata fields.',
      inputParams: CreateConceptToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: createConcept,
    },
    getConcept: {
      title: 'get_concept',
      description:
        'Retrieve a specific taxonomy concept from Contentful. Returns the complete concept with all its properties including prefLabel, definition, relationships, and other metadata.',
      inputParams: GetConceptToolParams.shape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
      tool: getConcept,
    },
    listConcepts: {
      title: 'list_concepts',
      description:
        'List taxonomy concepts in a Contentful organization. Supports multiple modes: (1) Default - list all concepts with pagination and filtering, (2) getTotalOnly - return only the total count of concepts, (3) getDescendants - get descendants of a specific concept (requires conceptId), (4) getAncestors - get ancestors of a specific concept (requires conceptId). Returns summarized view of concepts with essential information.',
      inputParams: ListConceptsToolParams.shape,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
      tool: listConcepts,
    },
    updateConcept: {
      title: 'update_concept',
      description:
        'Update a taxonomy concept in Contentful. Requires the concept ID and version number for optimistic concurrency control. You can update any combination of fields - only the fields you provide will be changed, while others remain unchanged. Use this to modify labels, definitions, relationships, and other concept properties.',
      inputParams: UpdateConceptToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: updateConcept,
    },
    deleteConcept: {
      title: 'delete_concept',
      description:
        'Delete a taxonomy concept from Contentful. Requires the concept ID and version number for optimistic concurrency control. This operation permanently removes the concept and cannot be undone.',
      inputParams: DeleteConceptToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: deleteConcept,
    },
  };
}
