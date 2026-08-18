import { z } from 'zod';
import { createClient } from 'contentful-management';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { createClientConfig } from '../../utils/tools.js';
import { summarizeData } from '../../utils/summarizer.js';
import type { ContentfulConfig } from '../../config/types.js';

// NOTE: This tool calls the aggregated usage endpoint via the SDK's plain-client
// escape hatch (`client.raw.get`) because `contentful-management.js` has not yet
// shipped `client.usage.getAggregated` (see MOI-6808 / contentful-management.js#3088).
// Follow-up MOI-7192 tracks swapping this for the typed SDK method once released.

export const AGGREGATED_USAGE_METRIC_KEYS = [
  'api_call_cma',
  'api_call_cpa',
  'api_call_cda',
  'api_call_graphql',
  'asset_bandwidth',
  'functions_invocations',
  'ai_action_invocation',
  'ai_action_word_count',
  'ai_consumption_unit',
] as const;

type AggregatedUsageMetricKey = (typeof AGGREGATED_USAGE_METRIC_KEYS)[number];

type SysLink = {
  sys: { type: 'Link'; linkType: string; id: string };
};

// A response dimension is either a classic Link (id-only families like
// space/app/function/ai_action/asset) or an embedded-entity block whose
// sys.type names the entity (e.g. 'Model') and carries the grouped suffixes.
type DimensionValue =
  | SysLink
  | { sys: { type: string; [suffix: string]: unknown } };

type AggregatedUsageItemProps = {
  sys: {
    id: string;
    type: string;
    key: string;
    organization: {
      sys: { type: 'Link'; linkType: 'Organization'; id: string };
    };
    unitOfMeasurement: string;
    dimensions: Record<string, DimensionValue>;
    accumulation: string;
  };
  dateRange: { start: string; end: string };
  granularity?: string;
  data: number[];
};

type AggregatedUsageCollectionProps = {
  sys: { type: 'Array' };
  total: number;
  skip: number;
  limit: number;
  items: AggregatedUsageItemProps[];
};

const FilterValueSchema = z.union([
  z.string().min(1),
  z.array(z.string().min(1)).min(1).max(10),
]);

// Per-metric allowed dimensions, from the Usage API OpenAPI `MetricDimensions` component.
// Values are in the wire form used by `group`, `filter`, and `order`.
// See: https://github.com/contentful/usage-api openapi/v1.oas3.yaml
export const METRIC_DIMENSIONS = {
  functions_invocations: [
    'sys.dimensions.space.sys.id',
    'sys.dimensions.app.sys.id',
    'sys.dimensions.function.sys.id',
  ],
  asset_bandwidth: [
    'sys.dimensions.space.sys.id',
    'sys.dimensions.asset.sys.id',
  ],
  api_call_cma: ['sys.dimensions.space.sys.id'],
  api_call_cpa: ['sys.dimensions.space.sys.id'],
  api_call_cda: ['sys.dimensions.space.sys.id'],
  api_call_graphql: ['sys.dimensions.space.sys.id'],
  ai_action_invocation: [
    'sys.dimensions.space.sys.id',
    'sys.dimensions.ai_action.sys.id',
    'sys.dimensions.model.sys.provider',
    'sys.dimensions.model.sys.id',
  ],
  ai_action_word_count: [
    'sys.dimensions.space.sys.id',
    'sys.dimensions.ai_action.sys.id',
    'sys.dimensions.model.sys.provider',
    'sys.dimensions.model.sys.id',
  ],
  ai_consumption_unit: [
    'sys.dimensions.space.sys.id',
    'sys.dimensions.ai_action.sys.id',
    'sys.dimensions.model.sys.provider',
    'sys.dimensions.model.sys.id',
  ],
} as const satisfies Record<AggregatedUsageMetricKey, readonly string[]>;

export const GetUsagesToolParams = z.object({
  organizationId: z
    .string()
    .optional()
    .describe(
      'Organization ID. If omitted, falls back to the ORGANIZATION_ID configured on the server.',
    ),
  metricKey: z
    .enum(AGGREGATED_USAGE_METRIC_KEYS)
    .describe(
      'Metric to aggregate. Availability depends on the products enabled for the organization. ' +
        'Allowed dimensions per metric (used by "group", "filter", and "order", all in the ' +
        'form sys.dimensions.<name>.sys.<suffix>): ' +
        'api_call_cma / api_call_cpa / api_call_cda / api_call_graphql → sys.dimensions.space.sys.id. ' +
        'asset_bandwidth → sys.dimensions.space.sys.id, sys.dimensions.asset.sys.id. ' +
        'functions_invocations → sys.dimensions.space.sys.id, sys.dimensions.app.sys.id, sys.dimensions.function.sys.id. ' +
        'ai_action_invocation / ai_action_word_count / ai_consumption_unit → sys.dimensions.space.sys.id, ' +
        'sys.dimensions.ai_action.sys.id, sys.dimensions.model.sys.provider, sys.dimensions.model.sys.id.',
    ),
  dateGte: z
    .string()
    .describe(
      'Start date (inclusive) in ISO-8601 format (YYYY-MM-DD or full date-time). ' +
        'Sent as query param date[gte]. Max lookback: 12 months from now.',
    ),
  dateLte: z
    .string()
    .describe(
      'End date (inclusive) in ISO-8601 format (YYYY-MM-DD or full date-time). ' +
        'Sent as query param date[lte].',
    ),
  granularity: z
    .enum(['P1D', 'P1M'])
    .optional()
    .describe(
      'Bucket size as an ISO-8601 duration: "P1D" (daily, max 31-day range) or "P1M" ' +
        '(monthly, max 12 calendar months including current). Default P1D.',
    ),
  group: z
    .string()
    .optional()
    .describe(
      'Comma-separated dimension keys (in the form sys.dimensions.<name>.sys.<suffix>) ' +
        'to group results by. Values must come from the allowed dimensions for the chosen ' +
        'metricKey (see metricKey description), e.g. "sys.dimensions.space.sys.id" or ' +
        '"sys.dimensions.space.sys.id,sys.dimensions.function.sys.id".',
    ),
  filter: z
    .record(z.string(), FilterValueSchema)
    .optional()
    .describe(
      'Filter by dimension values. Keys use the shape "sys.dimensions.<dimension>.sys.<attribute>", ' +
        'for example "sys.dimensions.space.sys.id" for the space_id dimension. Pass a string for a ' +
        'single-value filter or an array of up to 10 strings to filter by multiple values (uses the ' +
        '[in] operator). Available dimensions per metric are listed in the metricKey description.',
    ),
  limit: z
    .number()
    .int()
    .positive()
    .max(1000)
    .optional()
    .describe('Maximum number of items to return (1–1000, default 1000).'),
  skip: z
    .number()
    .int()
    .min(0)
    .max(10000)
    .optional()
    .describe('Number of items to skip for pagination (0–10000, default 0).'),
  order: z
    .string()
    .optional()
    .describe(
      'Column to sort by, in the form sys.dimensions.<name>.sys.<suffix>; ' +
        'prefix with "-" for descending (e.g. "-sys.dimensions.space.sys.id"). ' +
        'Allowed dimension columns match the metricKey (see metricKey description). ' +
        'The synthetic column "total_usage" is a bare token (e.g. "total_usage" or ' +
        '"-total_usage") and sums usage per group across the requested date range. ' +
        'When "group" is set, non-synthetic order columns must be a subset of grouped ' +
        'columns. Legacy underscore-form tokens (e.g. "space_id") return a 422.',
    ),
});

type Params = z.infer<typeof GetUsagesToolParams>;

function buildQuery(args: Params): Record<string, string | number> {
  const query: Record<string, string | number> = {};
  if (args.dateGte) query['date[gte]'] = args.dateGte;
  if (args.dateLte) query['date[lte]'] = args.dateLte;
  if (args.granularity) query['granularity'] = args.granularity;
  if (args.group) query['group'] = args.group;
  if (args.order) query['order'] = args.order;
  if (typeof args.limit === 'number') query['limit'] = args.limit;
  if (typeof args.skip === 'number') query['skip'] = args.skip;

  if (args.filter) {
    for (const [key, value] of Object.entries(args.filter)) {
      if (Array.isArray(value)) {
        query[`filter[${key}][in]`] = value.join(',');
      } else {
        query[`filter[${key}]`] = value;
      }
    }
  }

  return query;
}

export function getUsagesTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const organizationId = args.organizationId ?? config.organizationId;
    if (!organizationId) {
      throw new Error(
        'organizationId is required (either as a tool argument or via the ORGANIZATION_ID env var).',
      );
    }

    const client = createClient(createClientConfig(config), { type: 'plain' });

    const metricKey: AggregatedUsageMetricKey = args.metricKey;
    const collection = await client.raw.get<AggregatedUsageCollectionProps>(
      `/organizations/${organizationId}/usages/${metricKey}`,
      { params: buildQuery(args) },
    );

    const summarized = summarizeData(collection, {
      maxItems: 10,
      remainingMessage:
        'To see more usage buckets, please ask me to retrieve the next page using the skip parameter.',
    });

    return createSuccessResponse('Usage retrieved successfully', {
      usage: summarized,
      total: collection.total,
      limit: collection.limit,
      skip: collection.skip,
      metricKey,
      organizationId,
    });
  }

  return withErrorHandling(tool, 'Error retrieving usage');
}
