import { describe, it, expect } from 'vitest';
import { conceptSchemeTools } from './register.js';
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

describe('concept scheme tools collection', () => {
  it('should export conceptSchemeTools collection with correct structure', () => {
    expect(conceptSchemeTools).toBeDefined();
    expect(Object.keys(conceptSchemeTools)).toHaveLength(5);
  });

  it('should have createConceptScheme tool with correct properties', () => {
    const { createConceptScheme } = conceptSchemeTools;

    expect(createConceptScheme.title).toBe('create_concept_scheme');
    expect(createConceptScheme.description).toBe(
      'Create a new taxonomy concept scheme in Contentful. Concept schemes organize related concepts and provide hierarchical structure for taxonomy management. The prefLabel is required and should be localized. You can optionally provide a conceptSchemeId for a user-defined ID, or let Contentful generate one automatically. You can also include definitions, notes, and references to top-level concepts.',
    );
    expect(createConceptScheme.inputParams).toStrictEqual(
      CreateConceptSchemeToolParams.shape,
    );
    expect(createConceptScheme.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    });
    expect(createConceptScheme.tool).toBe(createConceptSchemeTool);
  });

  it('should have getConceptScheme tool with correct properties', () => {
    const { getConceptScheme } = conceptSchemeTools;

    expect(getConceptScheme.title).toBe('get_concept_scheme');
    expect(getConceptScheme.description).toBe(
      'Retrieve a specific taxonomy concept scheme from Contentful. Returns the complete concept scheme with all its properties including prefLabel, definition, topConcepts, and other metadata.',
    );
    expect(getConceptScheme.inputParams).toStrictEqual(
      GetConceptSchemeToolParams.shape,
    );
    expect(getConceptScheme.annotations).toEqual({
      readOnlyHint: true,
      openWorldHint: false,
    });
    expect(getConceptScheme.tool).toBe(getConceptSchemeTool);
  });

  it('should have listConceptSchemes tool with correct properties', () => {
    const { listConceptSchemes } = conceptSchemeTools;

    expect(listConceptSchemes.title).toBe('list_concept_schemes');
    expect(listConceptSchemes.description).toBe(
      'List taxonomy concept schemes in a Contentful organization. Supports pagination and filtering options. Returns a summarized view of concept schemes with essential information.',
    );
    expect(listConceptSchemes.inputParams).toStrictEqual(
      ListConceptSchemesToolParams.shape,
    );
    expect(listConceptSchemes.annotations).toEqual({
      readOnlyHint: true,
      openWorldHint: false,
    });
    expect(listConceptSchemes.tool).toBe(listConceptSchemesTool);
  });

  it('should have updateConceptScheme tool with correct properties', () => {
    const { updateConceptScheme } = conceptSchemeTools;

    expect(updateConceptScheme.title).toBe('update_concept_scheme');
    expect(updateConceptScheme.description).toBe(
      'Update a taxonomy concept scheme in Contentful. Requires the concept scheme ID and version number for optimistic concurrency control. You can update any combination of fields - only the fields you provide will be changed, while others remain unchanged. Use this to modify labels, definitions, relationships, and other concept scheme properties.',
    );
    expect(updateConceptScheme.inputParams).toStrictEqual(
      UpdateConceptSchemeToolParams.shape,
    );
    expect(updateConceptScheme.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    });
    expect(updateConceptScheme.tool).toBe(updateConceptSchemeTool);
  });

  it('should have deleteConceptScheme tool with correct properties', () => {
    const { deleteConceptScheme } = conceptSchemeTools;

    expect(deleteConceptScheme.title).toBe('delete_concept_scheme');
    expect(deleteConceptScheme.description).toBe(
      'Delete a taxonomy concept scheme from Contentful. Requires the concept scheme ID and version number for optimistic concurrency control. This operation permanently removes the concept scheme and cannot be undone.',
    );
    expect(deleteConceptScheme.inputParams).toStrictEqual(
      DeleteConceptSchemeToolParams.shape,
    );
    expect(deleteConceptScheme.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    });
    expect(deleteConceptScheme.tool).toBe(deleteConceptSchemeTool);
  });
});
