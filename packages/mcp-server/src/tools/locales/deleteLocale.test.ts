import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockArgs,
  testLocale,
  mockLocaleGet,
  mockLocaleDelete,
} from './mockClient.js';
import { deleteLocaleTool } from './deleteLocale.js';

import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';

describe('deleteLocaleTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete a locale successfully', async () => {
    const testArgs = {
      ...mockArgs,
      localeId: 'test-locale-id',
    };

    mockLocaleGet.mockResolvedValue(testLocale);
    mockLocaleDelete.mockResolvedValue(undefined);

    const result = await deleteLocaleTool(testArgs);

    expect(createToolClient).toHaveBeenCalledWith(testArgs);
    expect(mockLocaleGet).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      localeId: testArgs.localeId,
    });
    expect(mockLocaleDelete).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      localeId: testArgs.localeId,
    });

    const expectedResponse = formatResponse('Locale deleted successfully', {
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

  it('should handle errors when locale deletion fails', async () => {
    const testArgs = {
      ...mockArgs,
      localeId: 'test-locale-id',
    };

    const error = new Error('Deletion failed');
    mockLocaleGet.mockResolvedValue(testLocale);
    mockLocaleDelete.mockRejectedValue(error);

    const result = await deleteLocaleTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error deleting locale: Deletion failed',
        },
      ],
    });
  });
});
