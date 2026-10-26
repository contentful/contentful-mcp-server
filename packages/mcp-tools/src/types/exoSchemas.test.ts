import { describe, it, expect } from 'vitest';
import { ExperienceContentBindingsSchema } from './exoSchemas.js';

const link = {
  sys: {
    type: 'ResourceLink' as const,
    linkType: 'Contentful:Entry',
    urn: 'crn:contentful:::content:spaces/s/environments/e/entries/1',
  },
};
const sys = {
  type: 'ResourceLink' as const,
  linkType: 'Contentful:DataAssembly' as const,
  urn: 'crn:contentful:::experience:spaces/s/environments/e/dataAssemblies/d',
};

describe('ExperienceContentBindingsSchema', () => {
  it('accepts $literal-wrapped ResourceLinks unchanged', () => {
    const input = { sys, parameters: { title: { $literal: link } } };
    expect(ExperienceContentBindingsSchema.parse(input)).toEqual(input);
  });

  it('rejects bare ResourceLink parameters', () => {
    const result = ExperienceContentBindingsSchema.safeParse({
      sys,
      parameters: { title: link },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual([
      'parameters',
      'title',
      '$literal',
    ]);
  });

  it('rejects malformed parameters', () => {
    expect(() =>
      ExperienceContentBindingsSchema.parse({
        sys,
        parameters: { a: { foo: 'bar' } },
      }),
    ).toThrow();
  });
});
