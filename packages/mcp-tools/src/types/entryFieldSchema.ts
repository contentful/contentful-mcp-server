import { z } from 'zod';
import { richTextDocumentSchema } from './richTextSchema.js';

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

const jsonPrimitive = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

// JSON schema for freeform JSON fields (supports any valid JSON structure)
export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z
    .union([jsonPrimitive, z.array(jsonValueSchema), z.record(jsonValueSchema)])
    .describe('Freeform JSON value (not for Rich Text)'),
);

const fieldValueSchema = z.union([
  z.string().describe('Symbol, Text, or Date field'),
  z.number().describe('Integer or Number field'),
  z.boolean().describe('Boolean field'),
  richTextDocumentSchema,
  linkSchema.describe('Link field (Entry or Asset reference)'),
  resourceLinkSchema.describe('ResourceLink field'),
  locationSchema.describe('Location field'),
  z.array(z.string()).describe('Array field of Symbols'),
  z.array(linkSchema).describe('Array field of Links'),
  z.array(resourceLinkSchema).describe('Array field of ResourceLinks'),
  jsonValueSchema,
]);

// Every field value is keyed by locale, e.g. { "en-US": "hello" }
const localizedFieldSchema = z.record(fieldValueSchema);

export const entryFieldsSchema = z
  .record(localizedFieldSchema)
  .describe(
    'Field values to update. Keys are field IDs, values are locale-keyed objects. ' +
      'Will be merged with existing fields.',
  );
