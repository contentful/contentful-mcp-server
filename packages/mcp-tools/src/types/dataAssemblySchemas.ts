import { z } from 'zod';
import type {
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

// ── Parameters ─────────────────────────────────────────────────────────────────
// The tool schemas own the canonical parameter contract while the published SDK
// still types declarations as records. Record fields keep optional requiredness.

export const SAME_SPACE_CONTENT_SOURCE =
  'crn:contentful:::content:spaces/$self/environments/$self' as const;

const ParameterMetadataFields = {
  name: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
};

const DeclarationFields = {
  id: z.string().min(1).describe('Stable parameter identifier'),
  required: z.boolean().describe('Whether the parameter needs a value'),
};

function validateUniqueDeclarationIds(
  declarations: { id: string }[],
  ctx: z.RefinementCtx,
) {
  const ids = new Set<string>();
  declarations.forEach((declaration, index) => {
    if (ids.has(declaration.id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [index, 'id'],
        message: `A parameter with id "${declaration.id}" is already declared.`,
      });
    }
    ids.add(declaration.id);
  });
}

// Share all known-field validation; only the handling of extra object keys differs.
function createDataAssemblyParameterSchemas<
  UnknownKeys extends z.UnknownKeysParam,
>(
  object: <Shape extends z.ZodRawShape>(
    shape: Shape,
  ) => z.ZodObject<Shape, UnknownKeys>,
) {
  const DataAssemblyResourceLinkParameterSchema = object({
    ...ParameterMetadataFields,
    type: z.literal('ResourceLink'),
    linkType: z.enum(['Contentful:Entry', 'Contentful:Asset']).optional(),
    allowedResources: z.array(
      z.discriminatedUnion('type', [
        object({
          type: z.literal('Contentful:Entry'),
          source: z.literal(SAME_SPACE_CONTENT_SOURCE),
          allowedTypes: z.array(z.string()),
        }),
        object({
          type: z.literal('Contentful:Asset'),
          source: z.literal(SAME_SPACE_CONTENT_SOURCE),
        }),
      ]),
    ),
  });

  const StringParameterSchema = object({
    ...ParameterMetadataFields,
    type: z.literal('String'),
    fallbackValue: z.string().optional(),
    locked: z.boolean().optional(),
    validation: object({
      allowedValues: z.array(z.string()).optional(),
    }).optional(),
  });

  const NumberParameterSchema = object({
    ...ParameterMetadataFields,
    type: z.literal('Number'),
    fallbackValue: z.number().optional(),
    locked: z.boolean().optional(),
    validation: object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
  });

  const OrderExpressionParameterSchema = object({
    ...ParameterMetadataFields,
    type: z.literal('OrderExpression'),
    fallbackValue: z
      .array(
        object({
          path: z.string(),
          direction: z.enum(['asc', 'desc']),
        }),
      )
      .refine(
        (terms) =>
          new Set(terms.map((term) => term.path)).size === terms.length,
        'An ordering must not repeat a path.',
      )
      .optional(),
    locked: z.boolean().optional(),
    target: object({ resourceLink: z.string() }),
  });

  const RecordParameterSchema = object({
    ...ParameterMetadataFields,
    type: z.literal('Record'),
    fields: z
      .array(
        z.discriminatedUnion('type', [
          StringParameterSchema.extend({ id: DeclarationFields.id }),
          NumberParameterSchema.extend({ id: DeclarationFields.id }),
          OrderExpressionParameterSchema.extend({ id: DeclarationFields.id }),
        ]),
      )
      .superRefine(validateUniqueDeclarationIds),
    locked: z.boolean().optional(),
  });

  const DataAssemblyParameterConfigSchema = z
    .array(
      z.discriminatedUnion('type', [
        DataAssemblyResourceLinkParameterSchema.extend(DeclarationFields),
        StringParameterSchema.extend(DeclarationFields),
        NumberParameterSchema.extend(DeclarationFields),
        RecordParameterSchema.extend(DeclarationFields),
        OrderExpressionParameterSchema.extend(DeclarationFields),
      ]),
    )
    .superRefine(validateUniqueDeclarationIds);

  return {
    resourceLink: DataAssemblyResourceLinkParameterSchema,
    config: DataAssemblyParameterConfigSchema,
  };
}

const InputParameterSchemas = createDataAssemblyParameterSchemas((shape) =>
  z.object(shape).strict(),
);
const ResponseParameterSchemas = createDataAssemblyParameterSchemas((shape) =>
  z.object(shape).passthrough(),
);

export const DataAssemblyResourceLinkParameterSchema =
  InputParameterSchemas.resourceLink;
export type DataAssemblyResourceLinkParameter = z.infer<
  typeof DataAssemblyResourceLinkParameterSchema
>;

export const DataAssemblyParameterConfigSchema = InputParameterSchemas.config;
export type DataAssemblyParameterConfig = z.infer<
  typeof DataAssemblyParameterConfigSchema
>;

const DataAssemblyParameterResponseSchema = ResponseParameterSchemas.config;
export type DataAssemblyParameterResponse = z.infer<
  typeof DataAssemblyParameterResponseSchema
>;

/**
 * Validate known declarations while retaining unknown server metadata at every
 * object level. Extra keys have unknown values; caller inputs remain strict.
 */
export function parseDataAssemblyParameterResponse(
  parameters: unknown,
): DataAssemblyParameterResponse {
  return DataAssemblyParameterResponseSchema.parse(parameters);
}

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
