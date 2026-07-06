import { z } from 'zod';
import type { JsonValue, PlainClientAPI } from 'contentful-management';

// CMA.js does not re-export the individual ExO entity Props types
// (ComponentTypeProps, FragmentProps, etc.) or their nested constituents
// (ComponentTypeViewport, ComponentTypeDesignProperty, TreeNode, ...) by name
// from its package root — only the *Collection types make it into the public
// export surface. To pin these schemas to the canonical shapes anyway, derive
// them structurally off PlainClientAPI's method signatures, which are exported.
//
// Each derived alias is passed through Distribute<T> below, which forces TS to
// treat it as a distinct nominal type rather than a live indexed-access
// expression. Without this, combining two indexed-access types derived from the
// same CMA entity (e.g. ComponentTypeContentProperty + TreeNode, both derived
// from ComponentTypeEntity) in a single z.object()/extend() call makes tsup's
// declaration emit fail with TS2742 ("cannot be named without a reference to
// .../contentful-management/.../entities/component-type.js") — even though
// each type alone emits fine. Distribute<T> is written as a distributive
// conditional (`T extends any ? ... : never`) rather than a plain mapped type
// so it maps over each arm of a union separately, preserving discriminated
// unions like TreeNode instead of collapsing them to their common keys.
type Distribute<T> = T extends unknown ? { [K in keyof T]: T[K] } : never;

type ComponentTypeEntity = Awaited<ReturnType<PlainClientAPI['componentType']['get']>>;

export type ComponentTypeViewport = Distribute<ComponentTypeEntity['viewports'][number]>;
export type ComponentTypeContentProperty = Distribute<
  ComponentTypeEntity['contentProperties'][number]
>;
export type ComponentTypeDesignProperty = Distribute<
  ComponentTypeEntity['designProperties'][number]
>;
export type ComponentTypeSlotDefinition = Distribute<
  NonNullable<ComponentTypeEntity['slots']>[number]
>;
export type TreeNode = Distribute<NonNullable<ComponentTypeEntity['componentTree']>[number]>;
export type ComponentNode = Extract<TreeNode, { nodeType: 'Component' }>;
export type FragmentNode = Extract<TreeNode, { nodeType: 'Fragment' }>;
export type SlotNode = Extract<TreeNode, { nodeType: 'Slot' }>;
export type ComponentTreeDesignPropertyValue = ComponentNode['designProperties'][string];
export type ExoMetadataProps = Distribute<NonNullable<ComponentTypeEntity['metadata']>>;

type ExperienceEntity = Awaited<ReturnType<PlainClientAPI['experience']['get']>>;
export type ExperienceMetadataProps = Distribute<NonNullable<ExperienceEntity['metadata']>>;
export type ExperienceContentBindings = Distribute<
  NonNullable<ExperienceEntity['contentBindings']>
>;
export type ExperienceSlotNode = Distribute<
  NonNullable<ExperienceEntity['slots']>[string][number]
>;
export type InlineFragmentNode = Extract<ExperienceSlotNode, { nodeType: 'InlineFragment' }>;

// DataTypeDefinition is the bare recursive type ComponentTypeContentProperty extends
// (id/name/required/defaultValue are added on top) — recover it via the nested
// Array/Record arms, which reference the bare type for `items`/`fields` values.
export type DataTypeDefinition = Extract<ComponentTypeContentProperty, { type: 'Array' }>['items'];
export type PrimitiveDataTypeDefinition = Extract<
  DataTypeDefinition,
  { type: 'String' | 'Number' | 'Integer' | 'Boolean' }
>;
export type RichTextDataTypeDefinition = Extract<DataTypeDefinition, { type: 'RichText' }>;
export type ArrayDataTypeDefinition = Extract<DataTypeDefinition, { type: 'Array' }>;
export type RecordDataTypeDefinition = Extract<DataTypeDefinition, { type: 'Record' }>;
export type TypeRefDataTypeDefinition = Extract<DataTypeDefinition, { type: 'TypeRef' }>;
export type LiteralDataTypeDefinition = Extract<DataTypeDefinition, { type: 'Literal' }>;
export type DiscriminatedUnionDataTypeDefinition = Extract<
  DataTypeDefinition,
  { type: 'DiscriminatedUnion' }
>;

export type StringDesignProperty = Extract<ComponentTypeDesignProperty, { type: 'String' }>;
export type BooleanDesignProperty = Extract<ComponentTypeDesignProperty, { type: 'Boolean' }>;
export type TokenBackedDesignProperty = Exclude<
  ComponentTypeDesignProperty,
  StringDesignProperty | BooleanDesignProperty
>;

// ── Resource / entity links ───────────────────────────────────────────────────

const resourceLinkSchema = <T extends string>(linkType: T) =>
  z.object({
    sys: z.object({
      type: z.literal('ResourceLink'),
      linkType: z.literal(linkType),
      urn: z.string().describe('URN of the linked resource'),
    }),
  });

const linkSchema = <T extends string>(linkType: T) =>
  z.object({
    sys: z.object({
      type: z.literal('Link'),
      linkType: z.literal(linkType),
      id: z.string(),
    }),
  });

export const ComponentTypeResourceLinkSchema = resourceLinkSchema('Contentful:ComponentType');
export const FragmentResourceLinkSchema = resourceLinkSchema('Contentful:Fragment');

// ── Viewport ──────────────────────────────────────────────────────────────────
// Matches CMA.js ComponentTypeViewport

export const ViewportSchema = z.object({
  id: z.string().describe('Viewport identifier'),
  query: z.string().describe('CSS media query string'),
  displayName: z.string().describe('Human-readable viewport name'),
  previewSize: z.string().describe('Preview size (e.g. "1024px")'),
}) satisfies z.ZodType<ComponentTypeViewport>;

// ── Data type definition ──────────────────────────────────────────────────────
// Matches CMA.js DataTypeDefinition — a discriminated union keyed on `type`.
// Declared with z.lazy so the recursive Array/Record/DiscriminatedUnion arms
// can close over the binding before it is fully initialised.

export const DataTypeDefinitionSchema: z.ZodType<DataTypeDefinition> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({
      type: z.enum(['String', 'Number', 'Integer', 'Boolean']),
      name: z.string().optional(),
      required: z.boolean().optional(),
    }) satisfies z.ZodType<PrimitiveDataTypeDefinition>,
    z.object({
      type: z.literal('RichText'),
      name: z.string().optional(),
      required: z.boolean().optional(),
    }) satisfies z.ZodType<RichTextDataTypeDefinition>,
    z.object({
      type: z.literal('Array'),
      name: z.string().optional(),
      required: z.boolean().optional(),
      items: DataTypeDefinitionSchema,
    }) satisfies z.ZodType<ArrayDataTypeDefinition>,
    z.object({
      type: z.literal('Record'),
      name: z.string().optional(),
      required: z.boolean().optional(),
      fields: z.record(z.string(), DataTypeDefinitionSchema),
    }) satisfies z.ZodType<RecordDataTypeDefinition>,
    z.object({
      type: z.literal('TypeRef'),
      name: z.string().optional(),
      required: z.boolean().optional(),
      ref: z.object({
        sys: z.object({
          type: z.literal('ResourceLink'),
          linkType: z.string(),
          urn: z.string(),
        }),
      }),
    }) satisfies z.ZodType<TypeRefDataTypeDefinition>,
    z.object({
      type: z.literal('Literal'),
      name: z.string().optional(),
      required: z.boolean().optional(),
      value: z.custom<JsonValue>().describe('JSON literal value'),
      valueType: DataTypeDefinitionSchema,
    }) satisfies z.ZodType<LiteralDataTypeDefinition>,
    z.object({
      type: z.literal('DiscriminatedUnion'),
      name: z.string().optional(),
      required: z.boolean().optional(),
      discriminator: z.string(),
      members: z.array(DataTypeDefinitionSchema),
    }) satisfies z.ZodType<DiscriminatedUnionDataTypeDefinition>,
  ]),
);

// ── Content property ──────────────────────────────────────────────────────────
// Matches CMA.js ComponentTypeContentProperty = DataTypeDefinition & {id, name, required, defaultValue?}

export const ContentPropertySchema = z.intersection(
  DataTypeDefinitionSchema,
  z.object({
    id: z.string().describe('Content property identifier'),
    name: z.string().describe('Human-readable name'),
    required: z.boolean().describe('Whether the property is required'),
    defaultValue: z.unknown().optional().describe('Default value'),
  }),
) satisfies z.ZodType<ComponentTypeContentProperty>;

// ── Design property ───────────────────────────────────────────────────────────
// Matches CMA.js ComponentTypeDesignProperty = StringDesignProperty | BooleanDesignProperty | TokenBackedDesignProperty

const DTCG_DESIGN_PROPERTY_TYPES = [
  'DTCG.Color',
  'DTCG.Dimension',
  'DTCG.FontFamily',
  'DTCG.FontWeight',
  'DTCG.Duration',
  'DTCG.CubicBezier',
  'DTCG.Number',
  'DTCG.StrokeStyle',
  'DTCG.Border',
  'DTCG.Transition',
  'DTCG.Shadow',
  'DTCG.Gradient',
  'DTCG.Typography',
] as const;

const DesignPropertyCommonFieldsSchema = z.object({
  id: z.string().describe('Design property identifier'),
  name: z.string().describe('Human-readable name'),
  description: z.string().optional().describe('Optional description'),
});

const StringDesignPropertySchema = DesignPropertyCommonFieldsSchema.extend({
  type: z.literal('String'),
  fallbackValue: z
    .object({
      type: z.literal('ManualDesignValue'),
      value: z.string(),
    })
    .optional()
    .describe('Manual fallback value for this design property'),
  validations: z
    .array(
      z.object({
        regexp: z.object({
          pattern: z.string().describe('Regular expression pattern'),
        }),
      }),
    )
    .optional()
    .describe('Regexp validations constraining allowed string values'),
}) satisfies z.ZodType<StringDesignProperty>;

const BooleanDesignPropertySchema = DesignPropertyCommonFieldsSchema.extend({
  type: z.literal('Boolean'),
  fallbackValue: z
    .object({
      type: z.literal('ManualDesignValue'),
      value: z.boolean(),
    })
    .optional()
    .describe('Manual fallback value for this design property'),
}) satisfies z.ZodType<BooleanDesignProperty>;

const DesignTokenValueSchema = z.object({
  type: z.literal('DesignToken'),
  value: z.string().min(1).describe('Design token reference (non-empty)'),
});

const TokenBackedDesignPropertySchema = DesignPropertyCommonFieldsSchema.extend({
  type: z.enum(DTCG_DESIGN_PROPERTY_TYPES),
  fallbackValue: DesignTokenValueSchema.optional().describe(
    'Design-token-backed fallback value for this design property',
  ),
  allowedResources: z
    .array(
      z.object({
        type: z.literal('DesignToken'),
        value: z.string(),
        name: z.string().optional(),
      }),
    )
    .optional()
    .describe('Allowed design token resources'),
}) satisfies z.ZodType<TokenBackedDesignProperty>;

export const DesignPropertySchema = z.union([
  StringDesignPropertySchema,
  BooleanDesignPropertySchema,
  TokenBackedDesignPropertySchema,
]) satisfies z.ZodType<ComponentTypeDesignProperty>;

// ── Design property values (used in component tree / experience payloads) ────
// Matches CMA.js ManualDesignValue | DesignTokenValue, and the pointer/dimensioned wrappers

const ManualDesignValueSchema = z.object({
  type: z.literal('ManualDesignValue'),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export const DesignPropertyValueSchema = z.union([
  ManualDesignValueSchema,
  DesignTokenValueSchema,
]);

// CMA types this as a template-literal type (`$designProperties/${string}`),
// which z.string() alone can't satisfy at the type level even though it
// validates the same values at runtime — z.custom<T>() lets us pin the exact
// branded type while still validating with a plain regex (no z.templateLiteral
// dependency, which would require zod v4).
export const DesignPropertyPointerValueSchema = z.custom<`$designProperties/${string}`>(
  (val) => typeof val === 'string' && /^\$designProperties\//.test(val),
  { message: 'Must be a "$designProperties/..." pointer' },
);

export const DimensionedDesignPropertyValueSchema = z.record(
  z.string(),
  DesignPropertyValueSchema,
);

export const ComponentTreeDesignPropertyValueSchema = z.union([
  DesignPropertyValueSchema,
  DesignPropertyPointerValueSchema,
  DimensionedDesignPropertyValueSchema,
]) satisfies z.ZodType<ComponentTreeDesignPropertyValue>;

// ── Slot definition ───────────────────────────────────────────────────────────
// Matches CMA.js ComponentTypeSlotDefinition — allowed children are constrained
// via allowedResources, not a bare component type ID array.

export const COMPONENT_TYPE_ALLOWED_RESOURCE_SOURCE =
  'crn:contentful:::experience:spaces/$self/environments/$self' as const;

export const SlotDefinitionSchema = z.object({
  id: z.string().describe('Slot identifier'),
  name: z.string().describe('Human-readable name'),
  required: z.boolean().describe('Whether the slot must be filled'),
  validations: z
    .array(
      z.object({
        size: z
          .object({
            min: z.number().optional(),
            max: z.number().optional(),
          })
          .optional(),
      }),
    )
    .describe('Slot cardinality validations'),
  allowedResources: z
    .array(
      z.object({
        type: z.literal('Contentful:ComponentType'),
        source: z.literal(COMPONENT_TYPE_ALLOWED_RESOURCE_SOURCE),
        allowedTypes: z
          .array(z.string())
          .describe('IDs of component types allowed in this slot'),
      }),
    )
    .optional()
    .describe('Constrains which component types may be placed in this slot'),
}) satisfies z.ZodType<ComponentTypeSlotDefinition>;

// ── Component tree ────────────────────────────────────────────────────────────
// Matches CMA.js TreeNode = ComponentNode | FragmentNode | SlotNode
// All three schemas use z.lazy so none of the callbacks run at declaration
// time, allowing the mutual recursion between TreeNodeSchema and ComponentNodeSchema.

const FragmentNodeSchema = z.object({
  id: z.string().describe('Node identifier'),
  name: z.string().optional().describe('Optional display name'),
  nodeType: z.literal('Fragment').describe('Must be "Fragment"'),
  fragment: FragmentResourceLinkSchema.describe('Resource link to the referenced fragment'),
}) satisfies z.ZodType<FragmentNode>;

const SlotNodeSchema = z.object({
  id: z.string().describe('Node identifier'),
  nodeType: z.literal('Slot').describe('Must be "Slot"'),
  slotId: z.string().describe('ID of the slot definition to render'),
}) satisfies z.ZodType<SlotNode>;

// Declared before ComponentNodeSchema so z.lazy inside ComponentNodeSchema
// can close over the binding. Both use z.lazy so neither callback fires
// until parse time, by which point both variables are fully initialised.
export const TreeNodeSchema: z.ZodType<TreeNode> = z.lazy(() =>
  z.union([ComponentNodeSchema, FragmentNodeSchema, SlotNodeSchema]),
);

const ComponentNodeSchema: z.ZodType<ComponentNode> = z.lazy(() =>
  z.object({
    id: z.string().describe('Node identifier'),
    name: z.string().optional().describe('Optional display name'),
    nodeType: z.literal('Component').describe('Must be "Component"'),
    componentType: ComponentTypeResourceLinkSchema.describe(
      'Resource link to the component type to render',
    ),
    contentProperties: z
      .union([
        z.record(z.string(), z.unknown()),
        z.string().describe('"$contentProperties/..." pointer'),
      ])
      .describe(
        'Content property bindings — values or "$contentProperties/..." pointers',
      ),
    designProperties: z
      .record(z.string(), ComponentTreeDesignPropertyValueSchema)
      .describe(
        'Design property values — ManualDesignValue, DesignTokenValue, or "$designProperties/..." pointers',
      ),
    slots: z
      .record(z.string(), z.array(TreeNodeSchema))
      .describe('Child tree nodes keyed by slot ID'),
  }),
);

// ── Metadata ──────────────────────────────────────────────────────────────────
// CMA.js has two metadata shapes for ExO entities:
// - ExoMetadataProps {tags?, concepts?} for ComponentType / Template
// - ExperienceMetadataProps {tags?, concepts?, name?} for Experience / Fragment

const TagLinkSchema = linkSchema('Tag');
const ConceptLinkSchema = linkSchema('TaxonomyConcept');

export const ExoMetadataSchema = z.object({
  tags: z.array(TagLinkSchema).optional().describe('Tags attached to this entity'),
  concepts: z
    .array(ConceptLinkSchema)
    .optional()
    .describe('Taxonomy concepts attached to this entity'),
}) satisfies z.ZodType<ExoMetadataProps>;

export const ExperienceMetadataSchema = ExoMetadataSchema.extend({
  name: z.string().optional().describe('Variant label for this metadata entry'),
}) satisfies z.ZodType<ExperienceMetadataProps>;

// ── Experience content bindings / slots ───────────────────────────────────────
// Matches CMA.js ExperienceContentBindings and the Experience `slots` map,
// whose entries are Array<FragmentNode | InlineFragmentNode>.

export const DataAssemblyResourceLinkSchema = resourceLinkSchema('Contentful:DataAssembly');

export const ExperienceContentBindingsSchema = z.object({
  sys: DataAssemblyResourceLinkSchema.shape.sys,
  parameters: z
    .record(
      z.string(),
      z.object({
        sys: z.object({
          type: z.literal('ResourceLink'),
          linkType: z.string(),
          urn: z.string(),
        }),
      }),
    )
    .describe('Parameter bindings keyed by parameter ID'),
}) satisfies z.ZodType<ExperienceContentBindings>;

export const InlineFragmentNodeSchema: z.ZodType<InlineFragmentNode> = z.lazy(() =>
  z.object({
    id: z.string().describe('Node identifier'),
    nodeType: z.literal('InlineFragment').describe('Must be "InlineFragment"'),
    componentType: ComponentTypeResourceLinkSchema.describe(
      'Resource link to the component type this inline fragment renders',
    ),
    designProperties: z
      .record(z.string(), DimensionedDesignPropertyValueSchema)
      .describe('Design property values for this inline fragment'),
    contentBindings: ExperienceContentBindingsSchema.optional().describe(
      'Optional content bindings linking this inline fragment to a data assembly',
    ),
    slots: z
      .record(z.string(), z.array(ExperienceSlotNodeSchema))
      .optional()
      .describe('Child slot contents keyed by slot ID'),
  }),
);

export const ExperienceSlotNodeSchema: z.ZodType<ExperienceSlotNode> = z.lazy(() =>
  z.union([FragmentNodeSchema, InlineFragmentNodeSchema]),
);
