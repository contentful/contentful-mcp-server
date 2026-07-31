import { GetUsagesToolParams, getUsagesTool } from './getUsages.js';
import type { ContentfulConfig } from '../../config/types.js';

export function createUsageTools(config: ContentfulConfig) {
  const getUsages = getUsagesTool(config);

  return {
    getUsages: {
      title: 'get_usages',
      description:
        'Get aggregated usage metrics for a Contentful organization, optionally scoped to one or ' +
        'more spaces (or other dimensions) via filter/group. Calls the public Usage API ' +
        '(/organizations/{orgId}/usages/{metricKey}), scoped to a single metricKey per call. ' +
        'Supports date-range windowing, ISO-8601 granularity (e.g. "P1D"), grouping by dimensions ' +
        '(e.g. group="space"), and single-value / [in] filtering by dimensions ' +
        '(e.g. filter={"sys.dimensions.space.sys.id": "<space-id>"} or an array of up to 10 IDs). ' +
        'Use for questions like: "how much CMA traffic did this org make last month?", ' +
        '"which spaces used the most asset bandwidth this week?", "were there any AI action ' +
        'invocations for space X?".',
      inputParams: GetUsagesToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: getUsages,
    },
  };
}
