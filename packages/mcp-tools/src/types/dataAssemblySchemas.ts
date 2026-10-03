import { z } from 'zod';
import type {
  DataAssemblyParameterDefinitionWithId,
  DataAssemblyResourceLinkParameter,
  JsonValue,
  PlainClientAPI,
  PointerExpressionValue,
} from 'contentful-management';

// See exoSchemas.ts for why derived types are wrapped in Distribute<T>
// (a distributive mapped type) before being used in a z.ZodType<T> annotation —
// it avoids TS2742 "not portable" declaration-emit failures when combining
// types derived from the same CMA entity in one z.object()/extend() call.
type Distribute<T> = T extends unknown ? { [K in keyof T]: T[K] } : never;

type DataAssemblyEntity = Awaited<
  ReturnType<PlainClientAPI['dataAssembly']['get']>
>;

export type DataAssemblyDataTypeField = Distribute<
  DataAssemblyEntity['sys']['dataType'][number]
>;
// Discriminate by the specific type literals from DataTypeDefinition — the canonical arm
// has a narrow type literal for `type`, the legacy arm has `type: string` (wide). Using
// optional-field filters (source?, ref?) would match both arms and collapse to never.
export type CanonicalDataAssemblyDataTypeField = Extract<
  DataAssemblyDataTypeField,
  {
    type:
      | 'String'
      | 'Number'
      | 'Integer'
      | 'Boolean'
      | 'RichText'
      | 'Array'
      | 'Record'
      | 'TypeRef'
      | 'Literal'
      | 'DiscriminatedUnion';
  }
>;
export type LegacyDataAssemblyDataTypeField = Exclude<
  DataAssemblyDataTypeField,
  CanonicalDataAssemblyDataTypeField
>;

export type DataAssemblyParameterConfig =
  DataAssemblyParameterDefinitionWithId[];
export type { DataAssemblyResourceLinkParameter };

export type DataAssemblyResolverConfig = Distribute<
  DataAssemblyEntity['resolvers']
>;
export type DataAssemblyResolverDefinition = Distribute<
  DataAssemblyResolverConfig[string]
>;
export type DataAssemblyGraphQLResolver = Extract<
  DataAssemblyResolverDefinition,
  { source: 'Contentful:GraphQL' }
>;
export type DataAssemblyNestedResolver = Extract<
  DataAssemblyResolverDefinition,
  { source: 'Contentful:DataAssembly' }
>;

export type DataAssemblyMetadata = Distribute<DataAssemblyEntity['metadata']>;

// ── Pointer expressions ───────────────────────────────────────────────────────
// Matches CMA.js PointerExpressionValue — used by resolver `parameters` and the
// data assembly `return` mapping. Recursive, so declared with z.lazy.

export const PointerExpressionValueSchema: z.ZodType<PointerExpressionValue> =
  z.lazy(() =>
    z.union([
      z.string(),
      z.object({
        $from: z.union([
          z.string(),
          z.object({
            source: z.string(),
            select: PointerExpressionValueSchema.optional(),
          }),
        ]),
      }),
      z.object({ $literal: z.custom<JsonValue>() }),
      z.object({ $object: z.record(z.string(), PointerExpressionValueSchema) }),
      z.object({
        $on: z.object({
          type: z.record(z.string(), PointerExpressionValueSchema),
          default: PointerExpressionValueSchema.optional(),
        }),
      }),
      z.record(z.string(), PointerExpressionValueSchema),
    ]),
  );

// ── Data type field ────────────────────────────────────────────────────────────
// Matches CMA.js DataAssemblyDataTypeField = CanonicalDataAssemblyDataTypeField
// (DataTypeDefinition & {id, name}) | LegacyDataAssemblyDataTypeField (permissive
// pre-cutover shape, kept for backward compatibility with existing records).

const CanonicalDataTypeArmSchema = z
  .object({
    type: z.enum([
      'String',
      'Number',
      'Integer',
      'Boolean',
      'RichText',
      'Array',
      'Record',
      'TypeRef',
      'Literal',
      'DiscriminatedUnion',
    ]),
    id: z.string().describe('Data type field identifier'),
    name: z.string().describe('Human-readable name'),
    required: z.boolean().optional(),
  })
  .catchall(z.unknown());

const LegacyDataTypeArmSchema = z.object({
  id: z.string().describe('Data type field identifier'),
  name: z.string().describe('Human-readable name'),
  type: z.string(),
  required: z.boolean().optional(),
  source: z.string().optional(),
  ref: z.unknown().optional(),
}) satisfies z.ZodType<LegacyDataAssemblyDataTypeField>;

export const DataAssemblyDataTypeFieldSchema = z.union([
  CanonicalDataTypeArmSchema,
  LegacyDataTypeArmSchema,
]) satisfies z.ZodType<DataAssemblyDataTypeField>;

// ── Parameters ─────────────────────────────────────────────────────────────────
// Parameter definitions share the management SDK contract. Tool declarations use
// ordered arrays; Record fields keep their own optional requiredness.

export const SAME_SPACE_CONTENT_SOURCE =
  'crn:contentful:::content:spaces/$self/environments/$self' as const;

const ParameterMetadataFields = {
  name: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
};

export const DataAssemblyResourceLinkParameterSchema = z
  .object({
    ...ParameterMetadataFields,
    type: z.literal('ResourceLink'),
    linkType: z.enum(['Contentful:Entry', 'Contentful:Asset']).optional(),
    allowedResources: z.array(
      z.discriminatedUnion('type', [
        z
          .object({
            type: z.literal('Contentful:Entry'),
            source: z.literal(SAME_SPACE_CONTENT_SOURCE),
            allowedTypes: z.array(z.string()),
          })
          .strict(),
        z
          .object({
            type: z.literal('Contentful:Asset'),
            source: z.literal(SAME_SPACE_CONTENT_SOURCE),
          })
          .strict(),
      ]),
    ),
  })
  .strict() satisfies z.ZodType<DataAssemblyResourceLinkParameter>;

const StringParameterSchema = z
  .object({
    ...ParameterMetadataFields,
    type: z.literal('String'),
    fallbackValue: z.string().optional(),
    locked: z.boolean().optional(),
    validation: z
      .object({ allowedValues: z.array(z.string()).optional() })
      .strict()
      .optional(),
  })
  .strict();

const NumberParameterSchema = z
  .object({
    ...ParameterMetadataFields,
    type: z.literal('Number'),
    fallbackValue: z.number().optional(),
    locked: z.boolean().optional(),
    validation: z
      .object({ min: z.number().optional(), max: z.number().optional() })
      .strict()
      .optional(),
  })
  .strict();

const OrderExpressionParameterSchema = z
  .object({
    ...ParameterMetadataFields,
    type: z.literal('OrderExpression'),
    fallbackValue: z
      .array(
        z
          .object({
            path: z.string(),
            direction: z.enum(['asc', 'desc']),
          })
          .strict(),
      )
      .refine(
        (terms) =>
          new Set(terms.map((term) => term.path)).size === terms.length,
        'An ordering must not repeat a path.',
      )
      .optional(),
    locked: z.boolean().optional(),
    target: z.object({ resourceLink: z.string() }).strict(),
  })
  .strict();

const RecordParameterSchema = z
  .object({
    ...ParameterMetadataFields,
    type: z.literal('Record'),
    fields: z.array(
      z.discriminatedUnion('type', [
        StringParameterSchema.extend({ id: z.string() }),
        NumberParameterSchema.extend({ id: z.string() }),
        OrderExpressionParameterSchema.extend({ id: z.string() }),
      ]),
    ),
    locked: z.boolean().optional(),
  })
  .strict();

const DeclarationFields = {
  id: z.string().min(1).describe('Stable parameter identifier'),
  required: z.boolean().describe('Whether the parameter needs a value'),
};

export const DataAssemblyParameterConfigSchema = z
  .array(
    z.discriminatedUnion('type', [
      DataAssemblyResourceLinkParameterSchema.extend(DeclarationFields),
      StringParameterSchema.extend(DeclarationFields),
      NumberParameterSchema.extend(DeclarationFields),
      RecordParameterSchema.extend(DeclarationFields),
      OrderExpressionParameterSchema.extend(DeclarationFields),
    ]),
  )
  .superRefine((parameters, ctx) => {
    const ids = new Set<string>();
    parameters.forEach((parameter, index) => {
      if (ids.has(parameter.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'id'],
          message: `A parameter with id "${parameter.id}" is already declared.`,
        });
      }
      ids.add(parameter.id);
    });
  }) satisfies z.ZodType<DataAssemblyParameterConfig>;

// ── Resolvers ──────────────────────────────────────────────────────────────────
// Matches CMA.js DataAssemblyResolverDefinition = GraphQL | NestedDataAssembly resolver

export const DataAssemblyGraphQLResolverSchema = z.object({
  source: z.literal('Contentful:GraphQL'),
  query: z.string().describe('GraphQL query string'),
  parameters: PointerExpressionValueSchema.optional(),
}) satisfies z.ZodType<DataAssemblyGraphQLResolver>;

export const DataAssemblyNestedResolverSchema = z.object({
  source: z.literal('Contentful:DataAssembly'),
  dataAssembly: z.object({
    sys: z.object({
      type: z.literal('ResourceLink'),
      linkType: z.literal('Contentful:DataAssembly'),
      urn: z.string(),
    }),
  }),
  parameters: PointerExpressionValueSchema.optional(),
}) satisfies z.ZodType<DataAssemblyNestedResolver>;

export const DataAssemblyResolverDefinitionSchema = z.union([
  DataAssemblyGraphQLResolverSchema,
  DataAssemblyNestedResolverSchema,
]) satisfies z.ZodType<DataAssemblyResolverDefinition>;

export const DataAssemblyResolverConfigSchema = z.record(
  z.string(),
  DataAssemblyResolverDefinitionSchema,
) satisfies z.ZodType<DataAssemblyResolverConfig>;

// ── Return mapping ─────────────────────────────────────────────────────────────
// Matches CMA.js DataAssemblyReturnMappingConfig = PointerExpressionValue

export const DataAssemblyReturnMappingConfigSchema =
  PointerExpressionValueSchema;

// ── Metadata ───────────────────────────────────────────────────────────────────
// Matches CMA.js DataAssemblyCommonProps.metadata = Pick<MetadataProps, 'tags'>

export const DataAssemblyMetadataSchema = z.object({
  tags: z.array(
    z.object({
      sys: z.object({
        type: z.literal('Link'),
        linkType: z.literal('Tag'),
        id: z.string(),
      }),
    }),
  ),
}) satisfies z.ZodType<DataAssemblyMetadata>;
