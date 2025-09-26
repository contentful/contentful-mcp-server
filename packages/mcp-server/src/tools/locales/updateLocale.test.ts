import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockArgs,
  testLocale,
  mockLocaleGet,
  mockLocaleUpdate,
} from './mockClient.js';
import { updateLocaleTool } from './updateLocale.js';
import { createToolClient } from '../../utils/tools.js';
import { formatResponse } from '../../utils/formatters.js';

describe('updateLocaleTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update a locale successfully', async () => {
    const updateFields = {
      name: 'New Test Locale Name',
      optional: true,
    };
    const testArgs = {
      ...mockArgs,
      localeId: 'test-locale-id',
      fields: updateFields,
    };

    const updatedLocale = { ...testLocale, ...updateFields };

    mockLocaleGet.mockResolvedValue(testLocale);
    mockLocaleUpdate.mockResolvedValue(updatedLocale);

    const result = await updateLocaleTool(testArgs);

    expect(createToolClient).toHaveBeenCalledWith(testArgs);
    expect(mockLocaleGet).toHaveBeenCalledWith({
      spaceId: testArgs.spaceId,
      environmentId: testArgs.environmentId,
      localeId: testArgs.localeId,
    });
    expect(mockLocaleUpdate).toHaveBeenCalledWith(
      {
        spaceId: testArgs.spaceId,
        environmentId: testArgs.environmentId,
        localeId: testArgs.localeId,
      },
      { ...testLocale, ...updateFields },
    );

    const expectedResponse = formatResponse('Locale updated successfully', {
      updatedLocale,
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

  it('should handle errors when locale update fails', async () => {
    const testArgs = {
      ...mockArgs,
      localeId: 'test-locale-id',
      fields: { name: 'This will fail' },
    };

    const error = new Error('Update failed');
    mockLocaleGet.mockResolvedValue(testLocale);
    mockLocaleUpdate.mockRejectedValue(error);

    const result = await updateLocaleTool(testArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error updating locale: Update failed',
        },
      ],
    });
  });
});
