import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockArgs, testLocale, mockLocaleGetMany } from './mockClient.js';
import { listLocaleTool } from './listLocales.js';
import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';
import { createMockConfig } from '../../test-helpers/mockConfig.js';

const mockLocales = {
  items: [
    testLocale,
    { ...testLocale, sys: { ...testLocale.sys, id: 'test-locale-id-2' } },
  ],
  total: 2,
  limit: 100,
  skip: 0,
};

describe('listLocaleTool', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list locales successfully', async () => {
    mockLocaleGetMany.mockResolvedValue(mockLocales);

    const tool = listLocaleTool(mockConfig);
    const result = await tool(mockArgs);

    expect(createToolClient).toHaveBeenCalledWith(mockConfig, mockArgs);
    expect(mockLocaleGetMany).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      query: {
        limit: 100,
        skip: 0,
      },
    });

    const expectedLocales = mockLocales.items.map((locale) => ({
      id: locale.sys.id,
      name: locale.name,
      code: locale.code,
      fallbackCode: locale.fallbackCode || null,
      contentDeliveryApi: locale.contentDeliveryApi,
      contentManagementApi: locale.contentManagementApi,
      default: locale.default,
      optional: locale.optional,
      createdAt: locale.sys.createdAt,
      updatedAt: locale.sys.updatedAt,
      version: locale.sys.version,
    }));

    const expectedResponse = formatResponse('Locales retrieved successfully', {
      locales: {
        ...mockLocales,
        items: expectedLocales,
      },
      total: mockLocales.total,
      limit: mockLocales.limit,
      skip: mockLocales.skip,
    });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: expectedResponse,
        },
      ],
    });
  });

  it('should handle errors when listing locales fails', async () => {
    const error = new Error('Listing failed');
    mockLocaleGetMany.mockRejectedValue(error);

    const tool = listLocaleTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error listing locales: Listing failed',
        },
      ],
    });
  });
});
