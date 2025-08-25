import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockArgs, testLocale, mockLocaleGet } from './mockClient.js';
import { getLocaleTool } from './getLocale.js';

import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';

describe('getLocaleTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should retrieve a locale successfully', async () => {
    const testArgs = {
      ...mockArgs,
      localeId: 'test-locale-id',
    };

    mockLocaleGet.mockResolvedValue(testLocale);

    const result = await getLocaleTool(testArgs);

    expect(createToolClient).toHaveBeenCalledWith(testArgs);
    expect(mockLocaleGet).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      localeId: testArgs.localeId,
    });

    const expectedResponse = formatResponse('Locale retrieved successfully', {
      locale: testLocale,
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

  it('should handle errors when locale retrieval fails', async () => {
    const testArgs = {
      ...mockArgs,
      localeId: 'test-locale-id',
    };

    const error = new Error('Retrieval failed');
    mockLocaleGet.mockRejectedValue(error);

    const result = await getLocaleTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving locale: Retrieval failed',
        },
      ],
    });
  });
});
