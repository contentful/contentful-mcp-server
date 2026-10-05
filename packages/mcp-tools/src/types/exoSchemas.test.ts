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
  it('wraps bare ResourceLinks in $literal', () => {
    const result = ExperienceContentBindingsSchema.parse({
      sys,
      parameters: { title: link },
    });
    expect(result.parameters).toEqual({ title: { $literal: link } });
  });

  it('keeps already-wrapped $literal values unchanged', () => {
    const result = ExperienceContentBindingsSchema.parse({
      sys,
      parameters: { title: { $literal: link } },
    });
    expect(result.parameters).toEqual({ title: { $literal: link } });
  });

  it('is idempotent when re-parsed', () => {
    const once = ExperienceContentBindingsSchema.parse({
      sys,
      parameters: { a: link },
    });
    expect(ExperienceContentBindingsSchema.parse(once)).toEqual(once);
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
