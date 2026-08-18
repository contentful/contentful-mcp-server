import { vi } from 'vitest';

const { mockRawGet, mockCreateClient } = vi.hoisted(() => {
  const mockRawGet = vi.fn();
  const mockCreateClient = vi.fn(() => ({
    raw: {
      get: mockRawGet,
    },
  }));
  return { mockRawGet, mockCreateClient };
});

vi.mock('contentful-management', () => {
  return {
    default: {
      createClient: mockCreateClient,
    },
    createClient: mockCreateClient,
  };
});

export { mockRawGet, mockCreateClient };

export const testUsageCollection = {
  sys: { type: 'Array' as const },
  total: 1,
  skip: 0,
  limit: 100,
  items: [
    {
      sys: {
        id: 'mock-metric-id',
        type: 'AggregatedUsage',
        key: 'api_call_cma',
        organization: {
          sys: {
            type: 'Link' as const,
            linkType: 'Organization' as const,
            id: 'test-org-id',
          },
        },
        unitOfMeasurement: 'requests',
        dimensions: {},
        accumulation: 'integrate',
      },
      dateRange: { start: '2026-06-01', end: '2026-06-30' },
      granularity: 'P1D',
      data: [1200, 980, 1430],
    },
  ],
};
