import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockRawGet,
  mockCreateClient,
  testUsageCollection,
} from './mockClient.js';
import { getUsagesTool } from './getUsages.js';
import { formatResponse } from '../../utils/formatters.js';
import { summarizeData } from '../../utils/summarizer.js';
import { createClientConfig } from '../../utils/tools.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

describe('getUsagesTool', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the aggregated usage endpoint and returns a summarized response', async () => {
    mockRawGet.mockResolvedValue(testUsageCollection);

    const tool = getUsagesTool(mockConfig);
    const result = await tool({
      organizationId: 'test-org-id',
      metricKey: 'api_call_cma',
      dateGte: '2026-06-01',
      dateLte: '2026-06-30',
      granularity: 'P1D',
    });

    expect(mockCreateClient).toHaveBeenCalledWith(
      createClientConfig(mockConfig),
      { type: 'plain' },
    );
    expect(mockRawGet).toHaveBeenCalledWith(
      '/organizations/test-org-id/usages/api_call_cma',
      {
        params: {
          'date[gte]': '2026-06-01',
          'date[lte]': '2026-06-30',
          granularity: 'P1D',
        },
      },
    );

    const summarized = summarizeData(testUsageCollection, {
      maxItems: 10,
      remainingMessage:
        'To see more usage buckets, please ask me to retrieve the next page using the skip parameter.',
    });

    const expectedResponse = formatResponse('Usage retrieved successfully', {
      usage: summarized,
      total: testUsageCollection.total,
      limit: testUsageCollection.limit,
      skip: testUsageCollection.skip,
      metricKey: 'api_call_cma',
      organizationId: 'test-org-id',
    });

    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
  });

  it('falls back to config.organizationId when organizationId is omitted', async () => {
    mockRawGet.mockResolvedValue(testUsageCollection);

    const tool = getUsagesTool(mockConfig);
    await tool({
      metricKey: 'functions_invocations',
      dateGte: '2026-06-01',
      dateLte: '2026-06-30',
    });

    expect(mockRawGet).toHaveBeenCalledWith(
      '/organizations/test-org-id/usages/functions_invocations',
      {
        params: {
          'date[gte]': '2026-06-01',
          'date[lte]': '2026-06-30',
        },
      },
    );
  });

  it('serializes a single-value dimension filter as filter[<key>]=<value>', async () => {
    mockRawGet.mockResolvedValue(testUsageCollection);

    const tool = getUsagesTool(mockConfig);
    await tool({
      organizationId: 'test-org-id',
      metricKey: 'api_call_cma',
      dateGte: '2026-06-01',
      dateLte: '2026-06-30',
      filter: { 'sys.dimensions.space.sys.id': 'space-1' },
    });

    expect(mockRawGet).toHaveBeenCalledWith(
      '/organizations/test-org-id/usages/api_call_cma',
      {
        params: {
          'date[gte]': '2026-06-01',
          'date[lte]': '2026-06-30',
          'filter[sys.dimensions.space.sys.id]': 'space-1',
        },
      },
    );
  });

  it('serializes a multi-value dimension filter as filter[<key>][in]=<csv>', async () => {
    mockRawGet.mockResolvedValue(testUsageCollection);

    const tool = getUsagesTool(mockConfig);
    await tool({
      organizationId: 'test-org-id',
      metricKey: 'api_call_cma',
      dateGte: '2026-06-01',
      dateLte: '2026-06-30',
      filter: {
        'sys.dimensions.space.sys.id': ['space-1', 'space-2', 'space-3'],
      },
    });

    expect(mockRawGet).toHaveBeenCalledWith(
      '/organizations/test-org-id/usages/api_call_cma',
      {
        params: {
          'date[gte]': '2026-06-01',
          'date[lte]': '2026-06-30',
          'filter[sys.dimensions.space.sys.id][in]': 'space-1,space-2,space-3',
        },
      },
    );
  });

  it('passes group, order, limit, and skip through to the query', async () => {
    mockRawGet.mockResolvedValue(testUsageCollection);

    const tool = getUsagesTool(mockConfig);
    await tool({
      organizationId: 'test-org-id',
      metricKey: 'api_call_cma',
      dateGte: '2026-06-01',
      dateLte: '2026-06-30',
      group: 'space_id',
      order: '-total_usage',
      limit: 25,
      skip: 50,
    });

    expect(mockRawGet).toHaveBeenCalledWith(
      '/organizations/test-org-id/usages/api_call_cma',
      {
        params: {
          'date[gte]': '2026-06-01',
          'date[lte]': '2026-06-30',
          group: 'space_id',
          order: '-total_usage',
          limit: 25,
          skip: 50,
        },
      },
    );
  });

  it('returns an error response when no organizationId is provided or configured', async () => {
    const configWithoutOrg = createMockConfig({ organizationId: undefined });
    const tool = getUsagesTool(configWithoutOrg);
    const result = await tool({
      metricKey: 'api_call_cma',
      dateGte: '2026-06-01',
      dateLte: '2026-06-30',
    });

    expect(mockRawGet).not.toHaveBeenCalled();
    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving usage: organizationId is required (either as a tool argument or via the ORGANIZATION_ID env var).',
        },
      ],
    });
  });

  it('surfaces errors from the underlying API call', async () => {
    mockRawGet.mockRejectedValue(new Error('Request failed'));

    const tool = getUsagesTool(mockConfig);
    const result = await tool({
      organizationId: 'test-org-id',
      metricKey: 'api_call_cma',
      dateGte: '2026-06-01',
      dateLte: '2026-06-30',
    });

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving usage: Request failed',
        },
      ],
    });
  });
});
