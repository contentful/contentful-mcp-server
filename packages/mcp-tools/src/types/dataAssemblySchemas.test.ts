import { describe, expect, it } from 'vitest';
import {
  DataAssemblyParameterConfigSchema,
  SAME_SPACE_CONTENT_SOURCE,
} from './dataAssemblySchemas.js';

describe('DataAssembly parameter declarations', () => {
  it('preserves configuration for all parameter types and optional nested requiredness', () => {
    const parameters = [
      {
        id: 'headline',
        type: 'String',
        required: false,
        fallbackValue: '',
        locked: false,
        validation: { allowedValues: ['', 'Title'] },
      },
      {
        id: 'limit',
        type: 'Number',
        name: 'Limit',
        description: 'Results',
        required: true,
        fallbackValue: 5,
        validation: { min: 0, max: 10 },
      },
      {
        id: 'content',
        type: 'ResourceLink',
        required: true,
        allowedResources: [
          {
            type: 'Contentful:Entry',
            source: SAME_SPACE_CONTENT_SOURCE,
            allowedTypes: ['post'],
          },
          { type: 'Contentful:Asset', source: SAME_SPACE_CONTENT_SOURCE },
        ],
      },
      {
        id: 'options',
        type: 'Record',
        required: true,
        locked: true,
        fields: [
          { id: 'search', type: 'String', fallbackValue: '' },
          { id: 'limit', type: 'Number', required: false, fallbackValue: 2 },
          {
            id: 'order',
            type: 'OrderExpression',
            required: true,
            target: { resourceLink: 'content' },
            fallbackValue: [{ path: 'title', direction: 'asc' }],
          },
        ],
      },
      {
        id: 'sort',
        type: 'OrderExpression',
        required: false,
        target: { resourceLink: 'content' },
        fallbackValue: [
          { path: 'sys.createdAt', direction: 'desc' },
          { path: 'title', direction: 'asc' },
        ],
      },
    ];

    expect(DataAssemblyParameterConfigSchema.parse(parameters)).toEqual(
      parameters,
    );
  });

  it('accepts an empty declaration array', () => {
    expect(DataAssemblyParameterConfigSchema.parse([])).toEqual([]);
  });

  it.each([
    {},
    { title: { type: 'String', required: true } },
    [{ type: 'String', required: true }],
    [{ id: '', type: 'String', required: true }],
    [{ id: 2, type: 'String', required: true }],
    [{ id: 'title', type: 'String' }],
    [{ id: 'title', type: 'String', required: null }],
    [{ id: 'title', type: 'String', required: 'false' }],
    [{ id: 'title', type: 'String', required: 0 }],
  ])('rejects invalid declarations: %j', (parameters) => {
    expect(
      DataAssemblyParameterConfigSchema.safeParse(parameters).success,
    ).toBe(false);
  });

  it('reports duplicate IDs on the duplicate declaration', () => {
    const result = DataAssemblyParameterConfigSchema.safeParse([
      { id: 'title', type: 'String', required: true },
      { id: 'title', type: 'String', required: false },
    ]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: [1, 'id'] })]),
      );
    }
  });
});
