import { describe, expect, it } from 'vitest';
import {
  DataAssemblyParameterConfigSchema,
  SAME_SPACE_CONTENT_SOURCE,
} from './dataAssemblySchemas.js';

const parameter = {
  name: 'Post entry',
  type: 'ResourceLink' as const,
  linkType: 'Contentful:Entry' as const,
  allowedResources: [
    {
      type: 'Contentful:Entry' as const,
      source: SAME_SPACE_CONTENT_SOURCE,
      allowedTypes: ['blogPost'],
    },
  ],
};

describe('DataAssemblyParameterConfigSchema', () => {
  it('preserves legacy required values and omissions', () => {
    const parameters = {
      omitted: parameter,
      optional: { ...parameter, required: false },
      required: { ...parameter, required: true },
    };

    const result = DataAssemblyParameterConfigSchema.parse(parameters);

    expect(result).toEqual(parameters);
    expect(result).not.toHaveProperty('omitted.required');
  });

  it('preserves ordered parameter IDs, order, and required values', () => {
    const parameters = [
      { ...parameter, id: 'second', required: false },
      { ...parameter, id: 'first', required: true },
    ];

    expect(DataAssemblyParameterConfigSchema.parse(parameters)).toEqual(
      parameters,
    );
  });

  it('requires required on ordered parameters', () => {
    expect(
      DataAssemblyParameterConfigSchema.safeParse([
        { ...parameter, id: 'post' },
      ]).success,
    ).toBe(false);
  });

  it('reports duplicate ordered parameter IDs', () => {
    const result = DataAssemblyParameterConfigSchema.safeParse([
      { ...parameter, id: 'post', required: true },
      { ...parameter, id: 'post', required: false },
    ]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: [1, 'id'] })]),
      );
    }
  });

  it.each([null, 'false', 0])(
    'rejects a non-boolean required value: %s',
    (required) => {
      expect(
        DataAssemblyParameterConfigSchema.safeParse({
          post: { ...parameter, required },
        }).success,
      ).toBe(false);
      expect(
        DataAssemblyParameterConfigSchema.safeParse([
          { ...parameter, id: 'post', required },
        ]).success,
      ).toBe(false);
    },
  );
});
