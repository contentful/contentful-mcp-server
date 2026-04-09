import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';
import { z } from 'zod';

const emptyNodeDataSchema = z.object({});

const entryLinkTargetSchema = z.object({
  sys: z.object({
    id: z.string(),
    type: z.literal('Link'),
    linkType: z.literal('Entry'),
  }),
});

const assetLinkTargetSchema = z.object({
  sys: z.object({
    id: z.string(),
    type: z.literal('Link'),
    linkType: z.literal('Asset'),
  }),
});

const resourceLinkTargetSchema = z.object({
  sys: z.object({
    type: z.literal('ResourceLink'),
    linkType: z.string(),
    urn: z.string(),
  }),
});

const richTextMarkSchema = z.object({
  type: z.nativeEnum(MARKS),
});

const richTextTextNodeSchema = z.object({
  nodeType: z.literal('text'),
  value: z.string(),
  marks: z.array(richTextMarkSchema),
  data: emptyNodeDataSchema,
});

// BLOCKS.EMBEDDED_ENTRY = "embedded-entry-block"
const embeddedEntryBlockNodeSchema = z.object({
  nodeType: z.literal(BLOCKS.EMBEDDED_ENTRY),
  data: z.object({
    target: entryLinkTargetSchema,
  }),
  content: z.array(z.never()),
});

// INLINES.EMBEDDED_ENTRY = "embedded-entry-inline"
const embeddedEntryInlineNodeSchema = z.object({
  nodeType: z.literal(INLINES.EMBEDDED_ENTRY),
  data: z.object({
    target: entryLinkTargetSchema,
  }),
  content: z.array(z.never()),
});

// BLOCKS.EMBEDDED_ASSET = "embedded-asset-block"
const embeddedAssetBlockNodeSchema = z.object({
  nodeType: z.literal(BLOCKS.EMBEDDED_ASSET),
  data: z.object({
    target: assetLinkTargetSchema,
  }),
  content: z.array(z.never()),
});

// INLINES.HYPERLINK = "hyperlink"
const hyperlinkInlineNodeSchema = z.object({
  nodeType: z.literal(INLINES.HYPERLINK),
  data: z.object({
    uri: z.string().url(),
  }),
  content: z.array(richTextTextNodeSchema),
});

// INLINES.ENTRY_HYPERLINK = "entry-hyperlink"
const entryHyperlinkInlineNodeSchema = z.object({
  nodeType: z.literal(INLINES.ENTRY_HYPERLINK),
  data: z.object({
    target: entryLinkTargetSchema,
  }),
  content: z.array(richTextTextNodeSchema),
});

// INLINES.ASSET_HYPERLINK = "asset-hyperlink"
const assetHyperlinkInlineNodeSchema = z.object({
  nodeType: z.literal(INLINES.ASSET_HYPERLINK),
  data: z.object({
    target: assetLinkTargetSchema,
  }),
  content: z.array(richTextTextNodeSchema),
});

// BLOCKS.EMBEDDED_RESOURCE = "embedded-resource-block"
const embeddedResourceBlockNodeSchema = z.object({
  nodeType: z.literal(BLOCKS.EMBEDDED_RESOURCE),
  data: z.object({
    target: resourceLinkTargetSchema,
  }),
  content: z.array(z.never()),
});

// INLINES.EMBEDDED_RESOURCE = "embedded-resource-inline"
const embeddedResourceInlineNodeSchema = z.object({
  nodeType: z.literal(INLINES.EMBEDDED_RESOURCE),
  data: z.object({
    target: resourceLinkTargetSchema,
  }),
  content: z.array(z.never()),
});

// INLINES.RESOURCE_HYPERLINK = "resource-hyperlink"
const resourceHyperlinkInlineNodeSchema = z.object({
  nodeType: z.literal(INLINES.RESOURCE_HYPERLINK),
  data: z.object({
    target: resourceLinkTargetSchema,
  }),
  content: z.array(richTextTextNodeSchema),
});

// Union of all INLINE node types
const richTextInlineNodeSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([
    richTextTextNodeSchema,
    embeddedEntryInlineNodeSchema,
    hyperlinkInlineNodeSchema,
    entryHyperlinkInlineNodeSchema,
    assetHyperlinkInlineNodeSchema,
    embeddedResourceInlineNodeSchema,
    resourceHyperlinkInlineNodeSchema,
  ]),
);

// BLOCKS.PARAGRAPH = "paragraph"
const paragraphNodeSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    nodeType: z.literal(BLOCKS.PARAGRAPH),
    data: emptyNodeDataSchema,
    content: z.array(richTextInlineNodeSchema),
  }),
);

// BLOCKS.HEADING_1 = "heading-1", ..., BLOCKS.HEADING_6 = "heading-6"
const headingNodeSchema = (
  headingNodeType:
    | typeof BLOCKS.HEADING_1
    | typeof BLOCKS.HEADING_2
    | typeof BLOCKS.HEADING_3
    | typeof BLOCKS.HEADING_4
    | typeof BLOCKS.HEADING_5
    | typeof BLOCKS.HEADING_6,
) =>
  z.object({
    nodeType: z.literal(headingNodeType),
    data: emptyNodeDataSchema,
    content: z.array(richTextInlineNodeSchema),
  });

const heading1NodeSchema = headingNodeSchema(BLOCKS.HEADING_1);
const heading2NodeSchema = headingNodeSchema(BLOCKS.HEADING_2);
const heading3NodeSchema = headingNodeSchema(BLOCKS.HEADING_3);
const heading4NodeSchema = headingNodeSchema(BLOCKS.HEADING_4);
const heading5NodeSchema = headingNodeSchema(BLOCKS.HEADING_5);
const heading6NodeSchema = headingNodeSchema(BLOCKS.HEADING_6);

// BLOCKS.HR = "hr"
const hrNodeSchema = z.object({
  nodeType: z.literal(BLOCKS.HR),
  data: emptyNodeDataSchema,
  content: z.array(z.never()),
});

// BLOCKS.QUOTE = "quote"
const quoteNodeSchema = z.object({
  nodeType: z.literal(BLOCKS.QUOTE),
  data: emptyNodeDataSchema,
  content: z.array(paragraphNodeSchema),
});

// BLOCKS.TABLE_HEADER_CELL = "table-header-cell"
const tableHeaderCellNodeSchema = z.object({
  nodeType: z.literal(BLOCKS.TABLE_HEADER_CELL),
  data: emptyNodeDataSchema,
  content: z.array(paragraphNodeSchema),
});

// BLOCKS.TABLE_CELL = "table-cell"
const tableCellNodeSchema = z.object({
  nodeType: z.literal(BLOCKS.TABLE_CELL),
  data: emptyNodeDataSchema,
  content: z.array(paragraphNodeSchema),
});

// BLOCKS.TABLE_ROW = "table-row"
const tableRowNodeSchema = z.object({
  nodeType: z.literal(BLOCKS.TABLE_ROW),
  data: emptyNodeDataSchema,
  content: z.array(z.union([tableHeaderCellNodeSchema, tableCellNodeSchema])),
});

// BLOCKS.TABLE = "table"
const tableNodeSchema = z.object({
  nodeType: z.literal(BLOCKS.TABLE),
  data: emptyNodeDataSchema,
  content: z.array(tableRowNodeSchema),
});

// BLOCKS.OL_LIST = "ordered-list"
const orderedListNodeSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    nodeType: z.literal(BLOCKS.OL_LIST),
    data: emptyNodeDataSchema,
    content: z.array(listItemNodeSchema),
  }),
);

// BLOCKS.UL_LIST = "unordered-list"
const unorderedListNodeSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    nodeType: z.literal(BLOCKS.UL_LIST),
    data: emptyNodeDataSchema,
    content: z.array(listItemNodeSchema),
  }),
);

// BLOCKS.LIST_ITEM = "list-item"
const listItemNodeSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    nodeType: z.literal(BLOCKS.LIST_ITEM),
    data: emptyNodeDataSchema,
    content: z.array(
      z.union([
        paragraphNodeSchema,
        orderedListNodeSchema,
        unorderedListNodeSchema,
      ]),
    ),
  }),
);

// Union of all BLOCK node types
// Only these block types can be the direct children of the document.
const topLevelBlockNodeSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([
    paragraphNodeSchema,
    heading1NodeSchema,
    heading2NodeSchema,
    heading3NodeSchema,
    heading4NodeSchema,
    heading5NodeSchema,
    heading6NodeSchema,
    embeddedEntryBlockNodeSchema,
    embeddedAssetBlockNodeSchema,
    embeddedResourceBlockNodeSchema,
    orderedListNodeSchema,
    unorderedListNodeSchema,
    hrNodeSchema,
    quoteNodeSchema,
    tableNodeSchema,
  ]),
);

export const richTextDocumentSchema = z
  .object({
    nodeType: z.literal(BLOCKS.DOCUMENT),
    data: emptyNodeDataSchema,
    content: z.array(topLevelBlockNodeSchema),
  })
  .describe('Contentful Rich Text document');

export type RichTextDocument = z.infer<typeof richTextDocumentSchema>;
