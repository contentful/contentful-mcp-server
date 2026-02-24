import { z } from 'zod';
import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';

const markSchema = z.object({
  type: z.nativeEnum(MARKS),
});

const textNodeSchema = z.object({
  nodeType: z.literal('text'),
  value: z.string(),
  marks: z.array(markSchema).default([]),
  data: z.record(z.any()).default({}),
});

const inlineNodeSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    nodeType: z.nativeEnum(INLINES),
    data: z.record(z.any()),
    content: z.array(z.union([inlineNodeSchema, textNodeSchema])),
  }),
);

const blockNodeSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    nodeType: z.nativeEnum(BLOCKS),
    data: z.record(z.any()),
    content: z.array(
      z.union([blockNodeSchema, inlineNodeSchema, textNodeSchema]),
    ),
  }),
);

const topLevelBlockNodeSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    nodeType: z.enum([
      BLOCKS.PARAGRAPH,
      BLOCKS.HEADING_1,
      BLOCKS.HEADING_2,
      BLOCKS.HEADING_3,
      BLOCKS.HEADING_4,
      BLOCKS.HEADING_5,
      BLOCKS.HEADING_6,
      BLOCKS.OL_LIST,
      BLOCKS.UL_LIST,
      BLOCKS.HR,
      BLOCKS.QUOTE,
      BLOCKS.EMBEDDED_ENTRY,
      BLOCKS.EMBEDDED_ASSET,
      BLOCKS.EMBEDDED_RESOURCE,
      BLOCKS.TABLE,
    ]),
    data: z.record(z.any()),
    content: z.array(
      z.union([blockNodeSchema, inlineNodeSchema, textNodeSchema]),
    ),
  }),
);

const richTextDocumentSchema = z
  .object({
    nodeType: z.literal(BLOCKS.DOCUMENT),
    data: z.record(z.any()).default({}),
    content: z.array(topLevelBlockNodeSchema),
  })
  .describe('Contentful Rich Text document');

const linkSchema = z.object({
  sys: z.object({
    type: z.literal('Link'),
    linkType: z.enum(['Entry', 'Asset']),
    id: z.string(),
  }),
});

const resourceLinkSchema = z.object({
  sys: z.object({
    type: z.literal('ResourceLink'),
    linkType: z.string(),
    urn: z.string(),
  }),
});

const locationSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

const fieldValueSchema = z.union([
  z.string(), // Symbol, Text, Date
  z.number(), // Integer, Number
  z.boolean(), // Boolean
  richTextDocumentSchema, // RichText
  linkSchema, // Link (Entry or Asset)
  resourceLinkSchema, // ResourceLink
  locationSchema, // Location
  z.array(z.string()), // Array<Symbol>
  z.array(linkSchema), // Array<Link>
  z.array(resourceLinkSchema), // Array<ResourceLink>
  z.record(z.any()), // Object (freeform JSON)
]);

// --- Localized field wrapper ---
// Every field value is keyed by locale, e.g. { "en-US": "hello" }

const localizedFieldSchema = z.record(fieldValueSchema);

export const entryFieldsSchema = z
  .record(localizedFieldSchema)
  .describe(
    'Field values to update. Keys are field IDs, values are locale-keyed objects. ' +
      'Will be merged with existing fields.',
  );
