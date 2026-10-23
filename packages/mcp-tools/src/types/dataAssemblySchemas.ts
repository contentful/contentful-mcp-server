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

export type DataAssemblyParameterConfig = Distribute<
  DataAssemblyEntity['parameters']
>;
export type DataAssemblyResourceLinkParameter = Distribute<
  DataAssemblyParameterConfig[string]
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
// Matches CMA.js DataAssemblyResourceLinkParameter — the only parameter shape
// CMA currently models (a ResourceLink-typed input constrained to same-space entries).

export const SAME_SPACE_CONTENT_SOURCE =
  'crn:contentful:::content:spaces/$self/environments/$self' as const;

export const DataAssemblyResourceLinkParameterSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  type: z.literal('ResourceLink'),
  linkType: z.literal('Contentful:Entry'),
  allowedResources: z.array(
    z.object({
      type: z.literal('Contentful:Entry'),
      source: z.literal(SAME_SPACE_CONTENT_SOURCE),
      allowedTypes: z.array(z.string()),
    }),
  ),
}) satisfies z.ZodType<DataAssemblyResourceLinkParameter>;

export const DataAssemblyParameterConfigSchema = z.record(
  z.string(),
  DataAssemblyResourceLinkParameterSchema,
) satisfies z.ZodType<DataAssemblyParameterConfig>;

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
