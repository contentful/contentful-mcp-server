import { z } from 'zod';

// ── Viewport ──────────────────────────────────────────────────────────────────
// Matches CMA.js ComponentTypeViewport

export const ViewportSchema = z.object({
  id: z.string().describe('Viewport identifier'),
  query: z.string().describe('CSS media query string'),
  displayName: z.string().describe('Human-readable viewport name'),
  previewSize: z.string().describe('Preview size (e.g. "1024px")'),
});

// ── Content property ──────────────────────────────────────────────────────────
// Matches CMA.js ComponentTypeContentProperty

export const ContentPropertySchema = z.object({
  id: z.string().describe('Content property identifier'),
  name: z.string().describe('Human-readable name'),
  type: z
    .string()
    .describe('Property type (e.g. "String", "Number", "Boolean")'),
  required: z.boolean().describe('Whether the property is required'),
  defaultValue: z.unknown().optional().describe('Default value'),
});

// ── Design property ───────────────────────────────────────────────────────────
// Matches CMA.js ComponentTypeDesignProperty

const DesignPropertyValidationSchema = z.object({
  value: z
    .union([z.string(), z.number(), z.boolean()])
    .describe('Allowed value'),
  name: z.string().describe('Display name for the value'),
  description: z.string().optional().describe('Optional description'),
});

export const DesignPropertySchema = z.object({
  id: z.string().describe('Design property identifier'),
  name: z.string().describe('Human-readable name'),
  type: z
    .string()
    .describe('Property type (e.g. "Symbol", "Number", "Boolean")'),
  required: z.boolean().describe('Whether the property is required'),
  description: z.string().optional().describe('Description of the property'),
  defaultValue: z.unknown().optional().describe('Default value'),
  validations: z
    .object({
      in: z
        .array(DesignPropertyValidationSchema)
        .describe('Enumerated allowed values'),
    })
    .optional()
    .describe('Value constraints'),
  designTokenSet: z
    .array(z.string())
    .optional()
    .describe('Design token set IDs'),
});

// ── Slot definition ───────────────────────────────────────────────────────────
// Matches CMA.js ComponentTypeSlotDefinition

export const SlotDefinitionSchema = z.object({
  id: z.string().describe('Slot identifier'),
  name: z.string().describe('Human-readable name'),
  componentTypeId: z
    .array(z.string())
    .describe('IDs of component types allowed in this slot'),
  required: z.boolean().describe('Whether the slot must be filled'),
  validations: z.array(z.unknown()).describe('Slot validations'),
});

// ── Component tree ────────────────────────────────────────────────────────────
// Matches CMA.js TreeNode = ComponentNode | ViewNode | SlotNode
// Both ComponentNodeSchema and TreeNodeSchema use z.lazy so neither
// callback runs at declaration time, allowing mutual recursion.

export type ComponentNode = {
  id: string;
  nodeType: 'Component';
  componentTypeId: string;
  contentProperties: Record<string, unknown>;
  designProperties: Record<string, unknown>;
  slots: Record<string, TreeNode[]>;
  contentBindings?: string;
};

export type ViewNode = {
  id: string;
  nodeType: 'View';
  viewId: string;
};

export type SlotNode = {
  id: string;
  nodeType: 'Slot';
  slotId: string;
};

export type TreeNode = ComponentNode | ViewNode | SlotNode;

const ViewNodeSchema = z.object({
  id: z.string().describe('Node identifier'),
  nodeType: z.literal('View').describe('Must be "View"'),
  viewId: z.string().describe('ID of the referenced view'),
});

const SlotNodeSchema = z.object({
  id: z.string().describe('Node identifier'),
  nodeType: z.literal('Slot').describe('Must be "Slot"'),
  slotId: z.string().describe('ID of the slot definition to render'),
});

// Declared before ComponentNodeSchema so z.lazy inside ComponentNodeSchema
// can close over the binding. Both use z.lazy so neither callback fires
// until parse time, by which point both variables are fully initialised.
export const TreeNodeSchema: z.ZodType<TreeNode> = z.lazy(() =>
  z.union([ComponentNodeSchema, ViewNodeSchema, SlotNodeSchema]),
);

const ComponentNodeSchema: z.ZodType<ComponentNode> = z.lazy(() =>
  z.object({
    id: z.string().describe('Node identifier'),
    nodeType: z.literal('Component').describe('Must be "Component"'),
    componentTypeId: z
      .string()
      .describe('ID of the component type to render'),
    contentProperties: z
      .record(z.unknown())
      .describe(
        'Content property bindings — values or "$contentProperties/..." pointers',
      ),
    designProperties: z
      .record(z.unknown())
      .describe(
        'Design property values — ManualDesignValue, DesignTokenValue, or "$designProperties/..." pointers',
      ),
    slots: z
      .record(z.array(TreeNodeSchema))
      .describe('Child tree nodes keyed by slot ID'),
    contentBindings: z
      .string()
      .optional()
      .describe('Content bindings reference'),
  }),
);

// ── Metadata ──────────────────────────────────────────────────────────────────
// Matches CMA.js MetadataProps (tags: Link<'Tag'>[], concepts?: Link<'TaxonomyConcept'>[])

const TagLinkSchema = z.object({
  sys: z.object({
    type: z.literal('Link'),
    linkType: z.literal('Tag'),
    id: z.string().describe('Tag ID'),
  }),
});

const ConceptLinkSchema = z.object({
  sys: z.object({
    type: z.literal('Link'),
    linkType: z.literal('TaxonomyConcept'),
    id: z.string().describe('Taxonomy concept ID'),
  }),
});

export const ComponentTypeMetadataSchema = z.object({
  tags: z.array(TagLinkSchema).describe('Tags attached to this component type'),
  concepts: z
    .array(ConceptLinkSchema)
    .optional()
    .describe('Taxonomy concepts attached to this component type'),
});
