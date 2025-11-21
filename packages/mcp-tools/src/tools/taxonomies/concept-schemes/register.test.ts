import { describe, it, expect } from 'vitest';
import { createConceptSchemeTools } from './register.js';
import { CreateConceptSchemeToolParams } from './createConceptScheme.js';
import { GetConceptSchemeToolParams } from './getConceptScheme.js';
import { ListConceptSchemesToolParams } from './listConceptSchemes.js';
import { UpdateConceptSchemeToolParams } from './updateConceptScheme.js';
import { DeleteConceptSchemeToolParams } from './deleteConceptScheme.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('concept scheme tools collection', () => {
  const mockConfig = createMockConfig();

  it('should export createConceptSchemeTools factory function', () => {
    expect(createConceptSchemeTools).toBeDefined();
    expect(typeof createConceptSchemeTools).toBe('function');
  });

  it('should create conceptSchemeTools collection with correct structure', () => {
    const conceptSchemeTools = createConceptSchemeTools(mockConfig);
    expect(conceptSchemeTools).toBeDefined();
    expect(Object.keys(conceptSchemeTools)).toHaveLength(5);
  });

  it('should have createConceptScheme tool with correct properties', () => {
    const conceptSchemeTools = createConceptSchemeTools(mockConfig);
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
    expect(createConceptScheme.tool).toBeDefined();
    expect(typeof createConceptScheme.tool).toBe('function');
  });

  it('should have getConceptScheme tool with correct properties', () => {
    const conceptSchemeTools = createConceptSchemeTools(mockConfig);
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
    expect(getConceptScheme.tool).toBeDefined();
    expect(typeof getConceptScheme.tool).toBe('function');
  });

  it('should have listConceptSchemes tool with correct properties', () => {
    const conceptSchemeTools = createConceptSchemeTools(mockConfig);
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
    expect(listConceptSchemes.tool).toBeDefined();
    expect(typeof listConceptSchemes.tool).toBe('function');
  });

  it('should have updateConceptScheme tool with correct properties', () => {
    const conceptSchemeTools = createConceptSchemeTools(mockConfig);
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
    expect(updateConceptScheme.tool).toBeDefined();
    expect(typeof updateConceptScheme.tool).toBe('function');
  });

  it('should have deleteConceptScheme tool with correct properties', () => {
    const conceptSchemeTools = createConceptSchemeTools(mockConfig);
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
    expect(deleteConceptScheme.tool).toBeDefined();
    expect(typeof deleteConceptScheme.tool).toBe('function');
  });
});
