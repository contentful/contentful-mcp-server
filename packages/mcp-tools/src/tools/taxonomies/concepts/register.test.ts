import { describe, it, expect } from 'vitest';
import { conceptTools } from './register.js';
import { createConceptTool, CreateConceptToolParams } from './createConcept.js';
import { getConceptTool, GetConceptToolParams } from './getConcept.js';
import { listConceptsTool, ListConceptsToolParams } from './listConcepts.js';
import { updateConceptTool, UpdateConceptToolParams } from './updateConcept.js';
import { deleteConceptTool, DeleteConceptToolParams } from './deleteConcept.js';

describe('concept tools collection', () => {
  it('should export conceptTools collection with correct structure', () => {
    expect(conceptTools).toBeDefined();
    expect(Object.keys(conceptTools)).toHaveLength(5);
  });

  it('should have createConcept tool with correct properties', () => {
    const { createConcept } = conceptTools;

    expect(createConcept.title).toBe('create_concept');
    expect(createConcept.description).toBe(
      'Create a new taxonomy concept in Contentful. Concepts are used to organize and categorize content within taxonomies. The prefLabel is required and should be localized. You can optionally provide a conceptId for a user-defined ID, or let Contentful generate one automatically. You can also include definitions, notes, relationships to other concepts, and various metadata fields.',
    );
    expect(createConcept.inputParams).toStrictEqual(
      CreateConceptToolParams.shape,
    );
    expect(createConcept.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    });
    expect(createConcept.tool).toBe(createConceptTool);
  });

  it('should have getConcept tool with correct properties', () => {
    const { getConcept } = conceptTools;

    expect(getConcept.title).toBe('get_concept');
    expect(getConcept.description).toBe(
      'Retrieve a specific taxonomy concept from Contentful. Returns the complete concept with all its properties including prefLabel, definition, relationships, and other metadata.',
    );
    expect(getConcept.inputParams).toStrictEqual(GetConceptToolParams.shape);
    expect(getConcept.annotations).toEqual({
      readOnlyHint: true,
      openWorldHint: false,
    });
    expect(getConcept.tool).toBe(getConceptTool);
  });

  it('should have listConcepts tool with correct properties', () => {
    const { listConcepts } = conceptTools;

    expect(listConcepts.title).toBe('list_concepts');
    expect(listConcepts.description).toBe(
      'List taxonomy concepts in a Contentful organization. Supports multiple modes: (1) Default - list all concepts with pagination and filtering, (2) getTotalOnly - return only the total count of concepts, (3) getDescendants - get descendants of a specific concept (requires conceptId), (4) getAncestors - get ancestors of a specific concept (requires conceptId). Returns summarized view of concepts with essential information.',
    );
    expect(listConcepts.inputParams).toStrictEqual(
      ListConceptsToolParams.shape,
    );
    expect(listConcepts.annotations).toEqual({
      readOnlyHint: true,
      openWorldHint: false,
    });
    expect(listConcepts.tool).toBe(listConceptsTool);
  });

  it('should have updateConcept tool with correct properties', () => {
    const { updateConcept } = conceptTools;

    expect(updateConcept.title).toBe('update_concept');
    expect(updateConcept.description).toBe(
      'Update a taxonomy concept in Contentful. Requires the concept ID and version number for optimistic concurrency control. You can update any combination of fields - only the fields you provide will be changed, while others remain unchanged. Use this to modify labels, definitions, relationships, and other concept properties.',
    );
    expect(updateConcept.inputParams).toStrictEqual(
      UpdateConceptToolParams.shape,
    );
    expect(updateConcept.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    });
    expect(updateConcept.tool).toBe(updateConceptTool);
  });

  it('should have deleteConcept tool with correct properties', () => {
    const { deleteConcept } = conceptTools;

    expect(deleteConcept.title).toBe('delete_concept');
    expect(deleteConcept.description).toBe(
      'Delete a taxonomy concept from Contentful. Requires the concept ID and version number for optimistic concurrency control. This operation permanently removes the concept and cannot be undone.',
    );
    expect(deleteConcept.inputParams).toStrictEqual(
      DeleteConceptToolParams.shape,
    );
    expect(deleteConcept.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    });
    expect(deleteConcept.tool).toBe(deleteConceptTool);
  });
});
