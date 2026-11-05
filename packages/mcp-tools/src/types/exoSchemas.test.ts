import { describe, it, expect } from 'vitest';
import {
  ExperienceContentBindingsSchema,
  ExperienceSlotNodeSchema,
  InlineExperienceFragmentNodeSchema,
} from './exoSchemas.js';

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

describe('InlineExperienceFragmentNodeSchema designProperties', () => {
  const component = {
    sys: {
      type: 'ResourceLink' as const,
      linkType: 'Contentful:Component' as const,
      urn: 'crn:contentful:::experience:spaces/s/environments/e/components/heading',
    },
  };
  const node = (designProperties: unknown) => ({
    id: 'node-1',
    nodeType: 'InlineExperienceFragment' as const,
    component,
    designProperties,
  });

  it('accepts a flat ManualDesignValue', () => {
    const input = node({
      size: { type: 'ManualDesignValue', value: 'xlarge' },
    });
    expect(InlineExperienceFragmentNodeSchema.parse(input)).toEqual(input);
  });

  it('accepts a flat DesignToken', () => {
    const input = node({
      color: { type: 'DesignToken', value: 'color.primary' },
    });
    expect(InlineExperienceFragmentNodeSchema.parse(input)).toEqual(input);
  });

  it('accepts flat boolean and number manual values', () => {
    const input = node({
      bordered: { type: 'ManualDesignValue', value: true },
      columns: { type: 'ManualDesignValue', value: 3 },
    });
    expect(InlineExperienceFragmentNodeSchema.parse(input)).toEqual(input);
  });

  it('still accepts the dimensioned (viewport-keyed) shape', () => {
    const input = node({
      size: { desktop: { type: 'ManualDesignValue', value: 'large' } },
    });
    expect(InlineExperienceFragmentNodeSchema.parse(input)).toEqual(input);
  });

  it('accepts empty design properties', () => {
    expect(InlineExperienceFragmentNodeSchema.parse(node({}))).toEqual(
      node({}),
    );
  });

  it('accepts flat values on a node nested inside another node slot', () => {
    const input = {
      ...node({}),
      slots: {
        children: [
          node({ size: { type: 'ManualDesignValue', value: 'xlarge' } }),
        ],
      },
    };
    expect(ExperienceSlotNodeSchema.parse(input)).toEqual(input);
  });

  it('rejects a design value that is neither flat nor dimensioned', () => {
    expect(
      InlineExperienceFragmentNodeSchema.safeParse(
        node({ size: { type: 'ManualDesignValue' } }),
      ).success,
    ).toBe(false);
    expect(
      InlineExperienceFragmentNodeSchema.safeParse(
        node({ size: { type: 'Unknown', value: 'x' } }),
      ).success,
    ).toBe(false);
    expect(
      InlineExperienceFragmentNodeSchema.safeParse(node({ size: 'xlarge' }))
        .success,
    ).toBe(false);
  });
});
